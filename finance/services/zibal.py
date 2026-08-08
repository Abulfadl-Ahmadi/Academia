import logging
import requests
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from finance.models import Payment, PaymentLog

logger = logging.getLogger(__name__)


def tomans_to_rials(tomans: int) -> int:
    """Zibal API works in Rials. Convert Tomans -> Rials."""
    return int(tomans) * 10


def parse_zibal_datetime(dt_str):
    """Parse ISO datetime string returned by Zibal (e.g. '2022-07-06T14:18:21.742000') into aware datetime."""
    if not dt_str:
        return None
    try:
        dt = datetime.fromisoformat(dt_str)
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt
    except Exception as exc:
        logger.warning("Error parsing Zibal datetime '%s': %s", dt_str, exc)
        return None


def request_payment_service(
    payment: Payment,
    callback_url: str,
    mobile: str = None,
    national_code: str = None,
    check_mobile_with_card: bool = False,
    allowed_cards: list = None,
    percent_mode: int = None,
    fee_mode: int = None,
    multiplexing_infos: list = None,
    description: str = None,
    ip_address: str = None,
):
    """
    Call Zibal /v1/request API endpoint.
    Saves raw request & response payloads in Payment model and creates a PaymentLog.
    """
    merchant = settings.ZIBAL_MERCHANT_ID
    order_id_str = str(payment.order.id) if payment.order else (payment.order_id_str or f"ORD-{payment.id}")

    payload = {
        "merchant": merchant,
        "amount": payment.amount,  # in Rials
        "callbackUrl": callback_url,
        "description": description or payment.description or f"پرداخت سفارش #{order_id_str}",
        "orderId": order_id_str,
    }

    if mobile:
        payload["mobile"] = mobile
        payment.mobile = mobile
    if national_code:
        payload["nationalCode"] = national_code
        payment.national_code = national_code
    if check_mobile_with_card:
        payload["checkMobileWithCard"] = True
        payment.check_mobile_with_card = True
    if allowed_cards:
        payload["allowedCards"] = allowed_cards
        payment.allowed_cards = allowed_cards
    if percent_mode is not None:
        payload["percentMode"] = percent_mode
    if fee_mode is not None:
        payload["feeMode"] = fee_mode
    if multiplexing_infos:
        payload["multiplexingInfos"] = multiplexing_infos
        payment.multiplexing_data = multiplexing_infos

    payment.order_id_str = order_id_str
    payment.raw_request_payload = payload
    payment.save()

    try:
        resp = requests.post(settings.ZIBAL_REQUEST_URL, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        err_msg = f"خطا در ارتباط با درگاه زیبال: {exc}"
        logger.error("Zibal request network error for payment #%s: %s", payment.id, exc)
        payment.result_message = err_msg
        payment.raw_request_response = {"error": str(exc)}
        payment.save()

        PaymentLog.objects.create(
            payment=payment,
            action=PaymentLog.ActionType.REQUEST,
            request_data=payload,
            response_data={"error": str(exc)},
            ip_address=ip_address,
        )
        return False, None, err_msg

    result_code = data.get("result")
    message = data.get("message", "")
    payment.result_code = result_code
    payment.result_message = message
    payment.raw_request_response = data

    PaymentLog.objects.create(
        payment=payment,
        action=PaymentLog.ActionType.REQUEST,
        result_code=result_code,
        request_data=payload,
        response_data=data,
        ip_address=ip_address,
    )

    if result_code == 100:
        track_id = data.get("trackId")
        payment.track_id = track_id
        payment.zibal_status = -1  # Pending payment
        payment.save()
        payment_url = f"{settings.ZIBAL_START_URL}{track_id}"
        return True, payment_url, None
    else:
        payment.status = Payment.PaymentStatus.FAILED
        payment.save()
        logger.warning("Zibal request failed for payment #%s – result=%s msg=%s", payment.id, result_code, message)
        return False, None, f"کد خطا {result_code}: {message}"


def verify_payment_service(payment: Payment, ip_address: str = None):
    """
    Call Zibal /v1/verify API endpoint.
    Saves raw verify response payload in Payment model and creates a PaymentLog.
    """
    if not payment.track_id:
        return False, {}, "شناسه پیگیری (track_id) وجود ندارد."

    payload = {
        "merchant": settings.ZIBAL_MERCHANT_ID,
        "trackId": payment.track_id,
    }

    try:
        resp = requests.post(settings.ZIBAL_VERIFY_URL, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        err_msg = f"خطا در ارتباط با درگاه زیبال هنگام وریفای: {exc}"
        logger.error("Zibal verify network error for track_id=%s: %s", payment.track_id, exc)
        payment.raw_verify_response = {"error": str(exc)}
        payment.save()

        PaymentLog.objects.create(
            payment=payment,
            action=PaymentLog.ActionType.VERIFY,
            request_data=payload,
            response_data={"error": str(exc)},
            ip_address=ip_address,
        )
        return False, {}, err_msg

    result_code = data.get("result")
    message = data.get("message", "")
    zibal_status = data.get("status")

    payment.result_code = result_code
    payment.result_message = message
    if zibal_status is not None:
        payment.zibal_status = zibal_status
    payment.raw_verify_response = data

    if data.get("paidAt"):
        payment.paid_at = parse_zibal_datetime(data.get("paidAt"))
    if data.get("cardNumber"):
        payment.card_number = data.get("cardNumber")
    if data.get("refNumber"):
        payment.ref_number = str(data.get("refNumber"))
    if data.get("multiplexingInfos"):
        payment.multiplexing_data = data.get("multiplexingInfos")

    PaymentLog.objects.create(
        payment=payment,
        action=PaymentLog.ActionType.VERIFY,
        zibal_status=zibal_status,
        result_code=result_code,
        request_data=payload,
        response_data=data,
        ip_address=ip_address,
    )

    # 100 = verified, 201 = already verified
    if result_code in (100, 201):
        payment.status = Payment.PaymentStatus.SUCCESS
        payment.save()
        return True, data, None
    else:
        payment.status = Payment.PaymentStatus.FAILED
        payment.save()
        logger.warning("Zibal verify failed for track_id=%s – result=%s message=%s", payment.track_id, result_code, message)
        return False, data, message or f"کد خطا {result_code}"


def inquiry_payment_service(payment: Payment, ip_address: str = None):
    """
    Call Zibal /v1/inquiry API endpoint to fetch live transaction status.
    Saves raw inquiry response payload in Payment model, updates timestamps/statuses, and creates a PaymentLog.
    """
    if not payment.track_id:
        return False, {}, "شناسه پیگیری (track_id) وجود ندارد."

    payload = {
        "merchant": settings.ZIBAL_MERCHANT_ID,
        "trackId": payment.track_id,
    }

    try:
        resp = requests.post(settings.ZIBAL_INQUIRY_URL, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        err_msg = f"خطا در استعلام از درگاه زیبال: {exc}"
        logger.error("Zibal inquiry network error for track_id=%s: %s", payment.track_id, exc)
        payment.raw_inquiry_response = {"error": str(exc)}
        payment.save()

        PaymentLog.objects.create(
            payment=payment,
            action=PaymentLog.ActionType.INQUIRY,
            request_data=payload,
            response_data={"error": str(exc)},
            ip_address=ip_address,
        )
        return False, {}, err_msg

    result_code = data.get("result")
    message = data.get("message", "")
    zibal_status = data.get("status")

    payment.result_code = result_code
    payment.result_message = message
    if zibal_status is not None:
        payment.zibal_status = zibal_status
    payment.raw_inquiry_response = data

    if data.get("createdAt"):
        payment.zibal_created_at = parse_zibal_datetime(data.get("createdAt"))
    if data.get("paidAt"):
        payment.paid_at = parse_zibal_datetime(data.get("paidAt"))
    if data.get("verifiedAt"):
        payment.verified_at = parse_zibal_datetime(data.get("verifiedAt"))
    if data.get("cardNumber"):
        payment.card_number = data.get("cardNumber")
    if data.get("refNumber"):
        payment.ref_number = str(data.get("refNumber"))
    if data.get("wage") is not None:
        payment.wage = data.get("wage")
    if data.get("multiplexingInfos"):
        payment.multiplexing_data = data.get("multiplexingInfos")

    # Update payment status based on Zibal status code
    # Status 1: Verified Paid
    if zibal_status == 1:
        payment.status = Payment.PaymentStatus.SUCCESS
    elif zibal_status in (3, 4, 5, 6, 7, 8, 9, 10, 11, 12):
        payment.status = Payment.PaymentStatus.FAILED
    elif zibal_status in (15, 16, 18):
        payment.status = Payment.PaymentStatus.CANCELLED

    payment.save()

    PaymentLog.objects.create(
        payment=payment,
        action=PaymentLog.ActionType.INQUIRY,
        zibal_status=zibal_status,
        result_code=result_code,
        request_data=payload,
        response_data=data,
        ip_address=ip_address,
    )

    if result_code == 100:
        return True, data, None
    else:
        return False, data, message or f"کد نتیجه استعلام {result_code}"


def process_callback_service(payment: Payment, callback_data: dict, ip_address: str = None):
    """
    Process callback payload received from Zibal (GET query params or POST body).
    Stores raw payload, parses status, and logs event in PaymentLog.
    """
    payment.raw_callback_payload = callback_data

    success = callback_data.get("success")
    zibal_status_str = callback_data.get("status")
    card_number = callback_data.get("cardNumber")
    hashed_card_number = callback_data.get("hashedCardNumber")

    if zibal_status_str is not None:
        try:
            payment.zibal_status = int(zibal_status_str)
        except (ValueError, TypeError):
            pass

    if card_number:
        payment.card_number = card_number
    if hashed_card_number:
        payment.hashed_card_number = hashed_card_number

    payment.save()

    PaymentLog.objects.create(
        payment=payment,
        action=PaymentLog.ActionType.CALLBACK,
        zibal_status=payment.zibal_status,
        request_data=callback_data,
        response_data={"received": True},
        ip_address=ip_address,
    )
