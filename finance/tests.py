from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from finance.models import Order, OrderItem, Payment, PaymentLog
from finance.services.zibal import (
    tomans_to_rials, request_payment_service, verify_payment_service,
    inquiry_payment_service, process_callback_service
)
from shop.models import Product

User = get_user_model()


class ZibalIntegrationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="Password123!",
            role="student"
        )
        self.admin = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="Password123!",
            role="admin"
        )
        self.product = Product.objects.create(
            title="Test Course",
            description="Test product description",
            price=100000,
            product_type="course",
            creator=self.admin,
            is_active=True
        )
        self.order = Order.objects.create(
            user=self.user,
            total_amount=100000
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=100000,
            discount_amount=0
        )
        self.client = APIClient()

    def test_tomans_to_rials(self):
        self.assertEqual(tomans_to_rials(1000), 10000)

    @patch('finance.services.zibal.requests.post')
    def test_request_payment_service_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "result": 100,
            "trackId": 123456789,
            "message": "success"
        }
        mock_resp.raise_for_status.return_value = None
        mock_post.return_value = mock_resp

        payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=tomans_to_rials(self.order.total_amount),
            description="Test payment"
        )

        success, payment_url, err = request_payment_service(
            payment=payment,
            callback_url="http://example.com/callback",
            mobile="09123456789"
        )

        self.assertTrue(success)
        self.assertEqual(payment.track_id, 123456789)
        self.assertEqual(payment.zibal_status, -1)
        self.assertEqual(payment.result_code, 100)
        self.assertIn("123456789", payment_url)
        self.assertIsNotNone(payment.raw_request_payload)
        self.assertIsNotNone(payment.raw_request_response)

        # Check PaymentLog
        log = PaymentLog.objects.filter(payment=payment, action='request').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.result_code, 100)

    @patch('finance.services.zibal.requests.post')
    def test_verify_payment_service_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "result": 100,
            "status": 1,
            "refNumber": "987654321",
            "cardNumber": "62741****44",
            "paidAt": "2026-08-05T10:00:00.000000",
            "message": "success"
        }
        mock_post.return_value = mock_resp

        payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=tomans_to_rials(self.order.total_amount),
            track_id=123456789
        )

        success, data, err = verify_payment_service(payment)

        self.assertTrue(success)
        self.assertEqual(payment.status, Payment.PaymentStatus.SUCCESS)
        self.assertEqual(payment.ref_number, "987654321")
        self.assertEqual(payment.card_number, "62741****44")
        self.assertEqual(payment.zibal_status, 1)

        # Check PaymentLog
        log = PaymentLog.objects.filter(payment=payment, action='verify').first()
        self.assertIsNotNone(log)

    @patch('finance.services.zibal.requests.post')
    def test_inquiry_payment_service_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "result": 100,
            "status": 1,
            "refNumber": 987654321,
            "cardNumber": "62741****44",
            "createdAt": "2026-08-05T09:00:00.000000",
            "paidAt": "2026-08-05T10:00:00.000000",
            "verifiedAt": "2026-08-05T10:05:00.000000",
            "wage": 0,
            "amount": 1000000,
            "orderId": str(self.order.id),
            "message": "success"
        }
        mock_post.return_value = mock_resp

        payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=tomans_to_rials(self.order.total_amount),
            track_id=123456789
        )

        success, data, err = inquiry_payment_service(payment)

        self.assertTrue(success)
        self.assertEqual(payment.status, Payment.PaymentStatus.SUCCESS)
        self.assertEqual(payment.ref_number, "987654321")
        self.assertIsNotNone(payment.raw_inquiry_response)

        # Check PaymentLog
        log = PaymentLog.objects.filter(payment=payment, action='inquiry').first()
        self.assertIsNotNone(log)

    def test_process_callback_service(self):
        payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=tomans_to_rials(self.order.total_amount),
            track_id=123456789
        )

        callback_data = {
            "trackId": "123456789",
            "success": "1",
            "status": "2",
            "cardNumber": "62741****44",
            "hashedCardNumber": "HASH123456"
        }

        process_callback_service(payment, callback_data)

        self.assertEqual(payment.zibal_status, 2)
        self.assertEqual(payment.card_number, "62741****44")
        self.assertEqual(payment.hashed_card_number, "HASH123456")
        self.assertEqual(payment.raw_callback_payload, callback_data)

        log = PaymentLog.objects.filter(payment=payment, action='callback').first()
        self.assertIsNotNone(log)

    @patch('finance.views.inquiry_payment_service')
    def test_payment_inquiry_api_view(self, mock_inquiry):
        payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=tomans_to_rials(self.order.total_amount),
            track_id=123456789
        )
        mock_inquiry.return_value = (True, {"status": 1}, None)

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse('payment-inquiry'),
            {"track_id": 123456789},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('inquiry_success'))
        self.assertIn('payment', response.data)
        self.assertEqual(response.data['payment']['track_id'], 123456789)

