from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from shop.models import Coupon, Product
from courses.models import Course
from django.utils import timezone
import datetime

User = get_user_model()


class CouponSystemTestCase(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher_user", password="password123", role="teacher"
        )
        self.student = User.objects.create_user(
            username="student_user", password="password123", role="student"
        )
        self.course = Course.objects.create(
            title="تست ریاضی", description="توضیحات", teacher=self.teacher
        )
        self.product = Product.objects.create(
            title="محصول ریاضی", description="توضیحات", price=100000,
            product_type="course", course=self.course, creator=self.teacher
        )

        self.teacher_client = APIClient()
        self.teacher_client.force_authenticate(user=self.teacher)

        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student)

    def test_create_coupon_as_teacher(self):
        url = "/api/shop/coupons/"
        payload = {
            "code": "summer50",
            "discount_type": "percentage",
            "discount_value": 50,
            "max_uses": 10,
            "min_purchase_amount": 50000,
            "is_active": True
        }
        response = self.teacher_client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["code"], "SUMMER50")

    def test_validate_percentage_coupon(self):
        coupon = Coupon.objects.create(
            code="SUMMER20",
            discount_type="percentage",
            discount_value=20,
            created_by=self.teacher
        )
        url = "/api/shop/coupons/validate/"
        response = self.student_client.post(url, {
            "code": "summer20",
            "total_amount": 100000
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["valid"])
        self.assertEqual(response.data["discount_amount"], 20000)
        self.assertEqual(response.data["final_total"], 80000)

    def test_validate_fixed_coupon(self):
        coupon = Coupon.objects.create(
            code="FIXED30K",
            discount_type="fixed",
            discount_value=30000,
            created_by=self.teacher
        )
        url = "/api/shop/coupons/validate/"
        response = self.student_client.post(url, {
            "code": "fixed30k",
            "total_amount": 100000
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["discount_amount"], 30000)
        self.assertEqual(response.data["final_total"], 70000)

    def test_expired_coupon_rejected(self):
        past_time = timezone.now() - datetime.timedelta(days=1)
        coupon = Coupon.objects.create(
            code="EXPIRED10",
            discount_type="percentage",
            discount_value=10,
            valid_until=past_time,
            created_by=self.teacher
        )
        url = "/api/shop/coupons/validate/"
        response = self.student_client.post(url, {
            "code": "EXPIRED10",
            "total_amount": 100000
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_purchase_with_coupon(self):
        coupon = Coupon.objects.create(
            code="FULLFREE",
            discount_type="percentage",
            discount_value=100,
            created_by=self.teacher
        )
        url = "/api/shop/purchase/"
        payload = {
            "items": [{"product_id": self.product.id, "quantity": 1}],
            "coupon_code": "FULLFREE"
        }
        response = self.student_client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        coupon.refresh_from_db()
        self.assertEqual(coupon.used_count, 1)
