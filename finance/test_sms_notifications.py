from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.contrib.auth import get_user_model

from accounts.models import UserProfile
from finance.models import Order, OrderItem, SMSNotificationConfig, SMSNotificationLog
from finance.services.sms import send_sms_notifications_for_order
from shop.models import Product


User = get_user_model()


class SMSNotificationTestCase(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', password='x', role='admin')
        self.customer = User.objects.create_user(username='customer', password='x', role='student')
        UserProfile.objects.create(user=self.owner, phone_number='09120000001')
        self.product = Product.objects.create(
            title='Test product', description='Test', price=1000,
            product_type='course', creator=self.owner,
        )
        self.order = Order.objects.create(
            user=self.customer, total_amount=1000, status=Order.OrderStatus.PAID,
        )
        OrderItem.objects.create(order=self.order, product=self.product, price=1000)
        self.config = SMSNotificationConfig.objects.create(
            name='Sale report', template_text='Order {order_code}',
            custom_phone_numbers=['09120000001', '09120000002'],
        )
        self.config.admin_users.add(self.owner)

    @patch('finance.services.sms.send_custom_sms', return_value=(True, {'status': 1}, ''))
    def test_sends_to_unique_user_and_custom_phones_and_logs(self, send_sms):
        send_sms_notifications_for_order(self.order)

        self.assertEqual(send_sms.call_count, 2)
        self.assertEqual(
            set(SMSNotificationLog.objects.values_list('phone_number', flat=True)),
            {'09120000001', '09120000002'},
        )
        self.assertTrue(SMSNotificationLog.objects.filter(status='success').exists())

    @patch('finance.services.sms.send_custom_sms', return_value=(False, None, 'API error'))
    def test_provider_failure_is_logged(self, send_sms):
        send_sms_notifications_for_order(self.order)

        self.assertEqual(SMSNotificationLog.objects.filter(status='failed').count(), 2)
        self.assertEqual(self.order.status, Order.OrderStatus.PAID)

    def test_inactive_and_non_paid_orders_do_not_send(self):
        self.config.is_active = False
        self.config.save()
        with patch('finance.services.sms.send_custom_sms') as send_sms:
            send_sms_notifications_for_order(self.order)
            send_sms.assert_not_called()

        self.config.is_active = True
        self.config.save()
        self.order.status = Order.OrderStatus.PENDING
        self.order.save()
        with patch('finance.services.sms.send_custom_sms') as send_sms:
            send_sms_notifications_for_order(self.order)
            send_sms.assert_not_called()

    def test_invalid_phone_is_rejected(self):
        config = SMSNotificationConfig(
            name='Invalid', template_text='Order {order_code}',
            custom_phone_numbers=['123'],
        )
        with self.assertRaises(ValidationError):
            config.full_clean()

    @patch('finance.services.sms.send_custom_sms', return_value=(True, {'status': 1}, ''))
    def test_send_test_sms_notification(self, send_sms):
        from finance.services.sms import send_test_sms_notification

        res = send_test_sms_notification(
            config=self.config,
            phone_numbers='09129999999',
            test_context={'order_code': 'TEST-123'}
        )
        self.assertTrue(res['success'])
        self.assertEqual(send_sms.call_count, 1)
        # Check that log was created with order=None and [تست] in message
        test_log = SMSNotificationLog.objects.filter(phone_number='09129999999').first()
        self.assertIsNotNone(test_log)
        self.assertIn('[تست]', test_log.message)
        self.assertIsNone(test_log.order)
        self.assertEqual(test_log.status, 'success')
