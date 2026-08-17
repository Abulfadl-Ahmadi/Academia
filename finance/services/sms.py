"""SMS delivery service and automatic sale notifications."""

import json
import logging

import requests
from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)


def _request_sms(endpoint, payload):
    if not settings.SMS_IR_API_KEY:
        logger.warning("SMS_IR_API_KEY not configured")
        return False, None, "SMS_IR_API_KEY is not configured"

    try:
        response = requests.post(
            f"https://api.sms.ir/v1/send/{endpoint}",
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-KEY': settings.SMS_IR_API_KEY,
            },
            data=json.dumps(payload),
            timeout=10,
        )
        try:
            result = response.json()
        except ValueError:
            result = {'raw': response.text}
        if response.status_code == 200 and result.get('status') == 1:
            return True, result, ''
        return False, result, result.get('message', f'HTTP {response.status_code}')
    except requests.Timeout:
        return False, None, 'SMS API timeout'
    except requests.RequestException as exc:
        return False, None, str(exc)


def send_custom_sms(phone_number, message_text, sender_number=None):
    """Send one custom SMS using sms.ir's bulk endpoint."""
    if not phone_number or not phone_number.startswith('09') or len(phone_number) != 11:
        logger.warning("Invalid phone number format: %s", phone_number)
        return False, None, 'Invalid phone number format'
    sender_number = sender_number or getattr(settings, 'SMS_IR_LINE_NUMBER', '')
    payload = {
        'messageText': message_text,
        'mobiles': [phone_number],
    }
    if sender_number:
        payload['lineNumber'] = sender_number
    success, result, error = _request_sms('bulk', payload)
    if not success:
        logger.warning("SMS sending failed for %s: %s", phone_number, error)
    return success, result, error


def send_pattern_sms(phone_number, template_id, parameters):
    """Send a sms.ir verify/pattern message."""
    if not phone_number or not phone_number.startswith('09') or len(phone_number) != 11:
        return False, None, 'Invalid phone number format'
    return _request_sms('verify', {
        'mobile': phone_number,
        'templateId': template_id,
        'parameters': parameters,
    })


def send_sms_notifications_for_order(order):
    """Send configured notifications for a paid order and persist delivery logs."""
    from finance.models import SMSNotificationConfig, SMSNotificationLog

    configs = SMSNotificationConfig.objects.filter(is_active=True).prefetch_related('admin_users')
    for config in configs:
        if not config.matches_order(order):
            continue
        phones = config.get_recipient_phones()
        if not phones:
            logger.warning("No recipients for SMS config: %s", config.name)
            continue

        context = config.get_template_context(order)
        message = config.render_template(order)
        for phone in phones:
            success = False
            result = None
            error = ''
            try:
                if config.message_type == config.MessageType.VERIFY:
                    parameters = [
                        {'name': name, 'value': str(value).format(**context)}
                        for name, value in (config.template_parameters or {}).items()
                    ]
                    success, result, error = send_pattern_sms(phone, config.template_id, parameters)
                else:
                    success, result, error = send_custom_sms(phone, message)
            except Exception as exc:
                error = str(exc)
                logger.exception("SMS error for config %s and phone %s", config.name, phone)

            SMSNotificationLog.objects.create(
                config=config,
                order=order,
                phone_number=phone,
                message=message,
                status=SMSNotificationLog.Status.SUCCESS if success else SMSNotificationLog.Status.FAILED,
                error_message=error,
                provider_response=result,
            )


def schedule_sms_notifications_for_order(order):
    """Run notification delivery only after the surrounding DB transaction commits."""
    transaction.on_commit(
        lambda order_id=order.pk: send_sms_notifications_for_order(
            order.__class__.objects.get(pk=order_id)
        ), robust=True
    )


def send_test_sms_notification(config=None, phone_numbers=None, test_context=None, config_data=None):
    """
    Send a test SMS with fake/mock order data using live SMS gateway to verify delivery.
    """
    from finance.models import SMSNotificationConfig, SMSNotificationLog

    # Prepare mock/fake context data
    context = {
        'order_code': 'TEST-1403',
        'customer_name': 'کاربر آزمایشی',
        'customer_phone': '09120000000',
        'total_amount': '500,000',
        'product_titles': 'دوره آموزشی تست (محصول تستی)',
        'product_types': 'دوره آموزشی',
        'order_date': '۱۴۰۳/۰۵/۲۷ ۱۰:۳۰',
        'items_count': 1,
    }
    if test_context and isinstance(test_context, dict):
        context.update(test_context)

    # Determine message type and template
    message_type = 'bulk'
    template_id = None
    template_parameters = {}
    template_text = 'فروش جدید {order_code} | {product_titles} | {total_amount} تومان'
    config_name = 'گزارش آزمایشی'

    if config:
        message_type = config.message_type
        template_id = config.template_id
        template_parameters = config.template_parameters or {}
        template_text = config.template_text or template_text
        config_name = config.name
    elif config_data:
        message_type = config_data.get('message_type', message_type)
        template_id = config_data.get('template_id', template_id)
        template_parameters = config_data.get('template_parameters', template_parameters) or {}
        template_text = config_data.get('template_text', template_text) or template_text
        config_name = config_data.get('name', config_name) or config_name

    # Determine recipient phones
    if isinstance(phone_numbers, str):
        phones = [p.strip() for p in phone_numbers.replace(',', '\n').split('\n') if p.strip()]
    elif isinstance(phone_numbers, (list, tuple)):
        phones = [str(p).strip() for p in phone_numbers if str(p).strip()]
    elif config:
        phones = config.get_recipient_phones()
    else:
        phones = []

    # Clean unique phone list
    phones = list(dict.fromkeys(phones))

    if not phones:
        return {
            'success': False,
            'message': 'هیچ شماره موبایلی برای ارسال پیامک آزمایشی مشخص نشده است.',
            'results': [],
        }

    # Render template text
    try:
        rendered_text = template_text.format(**context)
    except Exception:
        rendered_text = template_text

    results = []
    overall_success = False

    for phone in phones:
        success = False
        result = None
        error = ''
        sent_message = rendered_text
        try:
            if message_type == 'verify' or (hasattr(SMSNotificationConfig, 'MessageType') and message_type == SMSNotificationConfig.MessageType.VERIFY):
                if not template_id:
                    error = 'شناسه الگو برای ارسال پیامک الگویی الزامی است.'
                else:
                    parameters = []
                    for name, value in (template_parameters or {}).items():
                        try:
                            val_str = str(value).format(**context)
                        except Exception:
                            val_str = str(value)
                        parameters.append({'name': name, 'value': val_str})
                    sent_message = f"الگو #{template_id}: " + ", ".join(f"{p['name']}={p['value']}" for p in parameters)
                    success, result, error = send_pattern_sms(phone, template_id, parameters)
            else:
                success, result, error = send_custom_sms(phone, rendered_text)
        except Exception as exc:
            error = str(exc)
            logger.exception("Test SMS error for phone %s", phone)

        if success:
            overall_success = True

        log = SMSNotificationLog.objects.create(
            config=config,
            order=None,
            phone_number=phone,
            message=f"[تست] {sent_message}",
            status=SMSNotificationLog.Status.SUCCESS if success else SMSNotificationLog.Status.FAILED,
            error_message=error,
            provider_response=result,
        )

        results.append({
            'phone_number': phone,
            'success': success,
            'error_message': error,
            'provider_response': result,
            'log_id': log.id,
            'rendered_text': sent_message,
        })

    return {
        'success': overall_success,
        'message': 'پیامک آزمایشی ارسال شد.' if overall_success else (results[0]['error_message'] if results and results[0]['error_message'] else 'ارسال پیامک با خطا مواجه شد.'),
        'results': results,
    }
