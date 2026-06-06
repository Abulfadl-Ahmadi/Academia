import logging

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404, redirect
from django.db import transaction
from django.utils import timezone
from django.conf import settings
import requests
from .models import Order, OrderItem, Transaction, UserAccess, Payment
from courses.models import Course
from .serializers import (
    OrderSerializer, OrderCreateSerializer, TransactionSerializer,
    TransactionCreateSerializer, UserAccessSerializer, OrderStatusUpdateSerializer,
    PaymentSerializer, PaymentInitiateSerializer
)
from shop.models import Product
from accounts.models import UserProfile
from .notifications import send_purchase_notification_email, send_payment_confirmation_email, send_product_access_granted_email

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Zibal helpers
# ---------------------------------------------------------------------------

def tomans_to_rials(tomans: int) -> int:
    """Zibal API works in Rials. Convert Tomans → Rials."""
    return tomans * 10


def _zibal_request(order, callback_url, mobile=None, description=None):
    """
    Send a payment-request to Zibal and return (track_id, payment_url, error_msg).
    amount must be in Rials (Zibal requirement).
    """
    merchant = settings.ZIBAL_MERCHANT_ID
    amount_rials = tomans_to_rials(order.total_amount)

    payload = {
        "merchant": merchant,
        "amount": amount_rials,
        "callbackUrl": callback_url,
        "description": description or f"پرداخت سفارش #{order.id}",
        "orderId": str(order.id),
    }
    if mobile:
        payload["mobile"] = mobile

    try:
        resp = requests.post(settings.ZIBAL_REQUEST_URL, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.error("Zibal request network error: %s", exc)
        return None, None, f"خطا در ارتباط با درگاه پرداخت: {exc}"

    result_code = data.get("result")
    if result_code == 100:
        track_id = data["trackId"]
        payment_url = f"{settings.ZIBAL_START_URL}{track_id}"
        return track_id, payment_url, None
    else:
        msg = data.get("message", f"کد خطا: {result_code}")
        logger.warning("Zibal request failed – result=%s message=%s", result_code, msg)
        return None, None, msg


def _zibal_verify(track_id):
    """
    Call Zibal /v1/verify.
    Returns (success: bool, data: dict, error_msg: str|None)
    """
    payload = {
        "merchant": settings.ZIBAL_MERCHANT_ID,
        "trackId": track_id,
    }
    try:
        resp = requests.post(settings.ZIBAL_VERIFY_URL, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.error("Zibal verify network error: %s", exc)
        return False, {}, f"خطا در ارتباط با درگاه پرداخت: {exc}"

    result_code = data.get("result")
    # 100 = verified, 201 = already verified (idempotent – treat as ok)
    if result_code in (100, 201):
        return True, data, None
    else:
        msg = data.get("message", f"کد نتیجه: {result_code}")
        logger.warning("Zibal verify failed – result=%s message=%s", result_code, msg)
        return False, data, msg


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

def grant_product_access(order):
    """Grant access to products when order is paid."""
    for item in order.items.all():
        access, created = UserAccess.objects.get_or_create(
            user=order.user,
            product=item.product,
            defaults={
                'order': order,
                'is_active': True,
            }
        )
        course = getattr(item.product, 'course', None)
        if course:
            course.students.add(order.user)
            course.save()
        if not created:
            access.order = order
            access.is_active = True
            access.save()
    # Send product access granted email
    send_product_access_granted_email(order)


# ---------------------------------------------------------------------------
# ViewSets
# ---------------------------------------------------------------------------

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all().select_related('user').prefetch_related('items__product')
        return Order.objects.filter(user=user).select_related('user').prefetch_related('items__product')

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """Create order then automatically initiate Zibal payment."""
        input_serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        input_serializer.is_valid(raise_exception=True)
        order = input_serializer.save()

        # Send admin notification (best-effort)
        try:
            send_purchase_notification_email(order)
        except Exception:
            pass

        # Initiate payment via Zibal
        callback_url = f"{settings.SERVER_IP}/finance/payment/callback/"
        mobile = getattr(request.user, 'phone', None)
        track_id, payment_url, error = _zibal_request(
            order, callback_url, mobile=mobile
        )

        if track_id:
            Payment.objects.create(
                user=request.user,
                order=order,
                amount=tomans_to_rials(order.total_amount),
                track_id=track_id,
                description=f"پرداخت سفارش #{order.id}",
            )
            return Response({
                "order": OrderSerializer(order, context={"request": request}).data,
                "payment_url": payment_url,
                "track_id": track_id,
                "message": "سفارش ایجاد شد. در حال انتقال به درگاه پرداخت زیبال...",
            }, status=status.HTTP_201_CREATED)

        # Payment initiation failed – return order but warn the user
        return Response({
            "order": OrderSerializer(order, context={"request": request}).data,
            "message": f"سفارش ایجاد شد اما مشکلی در اتصال به درگاه پرداخت وجود دارد: {error}",
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status (admin only)."""
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can update order status"},
                status=status.HTTP_403_FORBIDDEN
            )

        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)

        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            admin_notes = serializer.validated_data.get('admin_notes', '')

            order.status = new_status
            if admin_notes:
                order.admin_notes = admin_notes
            order.save()

            if new_status == Order.OrderStatus.PAID:
                grant_product_access(order)
                send_payment_confirmation_email(order)

            return Response({
                'message': f'Order status updated to {new_status}',
                'order': OrderSerializer(order).data,
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending orders (admin/teacher only)."""
        if request.user.role not in ('admin', 'teacher'):
            return Response(
                {"error": "Only admins can view pending orders"},
                status=status.HTTP_403_FORBIDDEN
            )

        pending_orders = Order.objects.filter(
            status=Order.OrderStatus.PENDING
        ).select_related('user').prefetch_related('items__product')

        serializer = OrderSerializer(pending_orders, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'teacher'):
            return Transaction.objects.all().select_related('order', 'created_by')
        return Transaction.objects.filter(order__user=user).select_related('order', 'created_by')

    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            transaction_obj = serializer.save(created_by=self.request.user)

            order = transaction_obj.order
            order.status = Order.OrderStatus.PAID
            order.save()
            print(order.id, ":", order.status)

            grant_product_access(order)

            # Promote to CONFIRMED if user has a national ID
            try:
                user_profile = UserProfile.objects.get(user=order.user)
                if user_profile.national_id:
                    order.status = Order.OrderStatus.CONFIRMED
                    order.save()
            except UserProfile.DoesNotExist:
                pass


class UserAccessViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserAccessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return UserAccess.objects.filter(
            user=user,
            is_active=True
        ).select_related('product', 'order').prefetch_related(
            'product__file',
            'product__course',
            'product__test',
        )

    @action(detail=False, methods=['get'])
    def my_products(self, request):
        """Get current user's accessible products."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Miscellaneous API views
# ---------------------------------------------------------------------------

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can access dashboard"},
                status=status.HTTP_403_FORBIDDEN
            )

        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status=Order.OrderStatus.PENDING).count()
        total_revenue = sum(
            order.total_amount for order in Order.objects.filter(status=Order.OrderStatus.PAID)
        )
        recent_orders = Order.objects.order_by('-created_at')[:10]
        recent_transactions = Transaction.objects.order_by('-created_at')[:10]

        return Response({
            'statistics': {
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'total_revenue': total_revenue,
                'paid_orders': Order.objects.filter(status=Order.OrderStatus.PAID).count(),
            },
            'recent_orders': OrderSerializer(recent_orders, many=True).data,
            'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
        })


class ProductAccessCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {"error": "product_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            access = UserAccess.objects.get(user=request.user, product=product, is_active=True)
            if access.is_expired:
                return Response({"has_access": False, "message": "Access has expired"})
            return Response({"has_access": True, "access": UserAccessSerializer(access).data})
        except UserAccess.DoesNotExist:
            return Response({"has_access": False, "message": "Product not purchased"})


# ---------------------------------------------------------------------------
# Zibal Payment views
# ---------------------------------------------------------------------------

class PaymentInitiateView(APIView):
    """
    POST /finance/payment/initiate/
    Body: { "order_id": <int>, "description": "<optional>" }

    Creates a Zibal payment session and returns the payment URL.
    The amount is always taken from the order (server-side) to prevent tampering.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order_id = serializer.validated_data['order_id']
        description = serializer.validated_data.get('description', f'پرداخت سفارش #{order_id}')

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "سفارش یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        if order.status == Order.OrderStatus.PAID:
            return Response({"error": "این سفارش قبلاً پرداخت شده است"}, status=status.HTTP_400_BAD_REQUEST)

        callback_url = f"{settings.SERVER_IP}/finance/payment/callback/"
        mobile = getattr(request.user, 'phone', None)

        track_id, payment_url, error = _zibal_request(
            order, callback_url, mobile=mobile, description=description
        )

        if not track_id:
            return Response(
                {"error": f"خطا در دریافت لینک پرداخت: {error}"},
                status=status.HTTP_502_BAD_GATEWAY
            )

        payment = Payment.objects.create(
            user=request.user,
            order=order,
            amount=tomans_to_rials(order.total_amount),
            track_id=track_id,
            description=description,
        )

        return Response({
            "payment_url": payment_url,
            "track_id": track_id,
        })


class PaymentCallbackView(APIView):
    """
    GET /finance/payment/callback/
    Zibal redirects here after payment with query params:
        ?trackId=<id>&success=<0|1>&status=<code>&orderId=<order_id>

    Verifies the payment with Zibal and redirects the user to the frontend.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        FRONTEND_URL = settings.FRONTEND_BASE_URL

        track_id_param = request.GET.get('trackId')
        success_param = request.GET.get('success')
        zibal_status = request.GET.get('status')

        # If Zibal reports failure up-front
        if success_param != '1' or not track_id_param:
            logger.warning(
                "Zibal callback – payment not successful. trackId=%s success=%s status=%s",
                track_id_param, success_param, zibal_status
            )
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id_param}")

        try:
            track_id = int(track_id_param)
        except (TypeError, ValueError):
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id_param}")

        # Fetch our Payment record
        try:
            payment = Payment.objects.get(track_id=track_id)
        except Payment.DoesNotExist:
            logger.error("Zibal callback – no Payment found for trackId=%s", track_id)
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id}")

        # Guard against double-processing
        if payment.status == Payment.PaymentStatus.SUCCESS:
            ref = payment.ref_number or ''
            return redirect(f"{FRONTEND_URL}/payment/success?refNumber={ref}")

        # Call Zibal verify
        verified, verify_data, error_msg = _zibal_verify(track_id)

        if verified:
            ref_number = str(verify_data.get('refNumber', ''))
            card_number = verify_data.get('cardNumber', '')
            paid_at = verify_data.get('paidAt', '')

            payment.status = Payment.PaymentStatus.SUCCESS
            payment.ref_number = ref_number
            payment.card_number = card_number
            payment.save()

            if payment.order:
                with transaction.atomic():
                    payment.order.status = Order.OrderStatus.PAID
                    payment.order.save()

                    # Record the transaction
                    Transaction.objects.create(
                        order=payment.order,
                        amount=payment.order.total_amount,  # store in Tomans
                        transaction_type=Transaction.TransactionType.PURCHASE,
                        payment_method=Transaction.PaymentMethod.ONLINE_PAYMENT,
                        reference_number=ref_number,
                        description=f"پرداخت آنلاین زیبال - شماره پیگیری: {ref_number}",
                        created_by=payment.user,
                    )

                    grant_product_access(payment.order)
                    send_payment_confirmation_email(payment.order)

            return redirect(f"{FRONTEND_URL}/payment/success?refNumber={ref_number}&trackId={track_id}")

        else:
            payment.status = Payment.PaymentStatus.FAILED
            payment.save()
            logger.warning(
                "Zibal verify failed for trackId=%s – %s",
                track_id, error_msg
            )
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id}")
