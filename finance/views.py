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
from .models import Order, OrderItem, Transaction, UserAccess, Payment, PaymentLog
from courses.models import Course
from .serializers import (
    OrderSerializer, OrderCreateSerializer, TransactionSerializer,
    TransactionCreateSerializer, UserAccessSerializer, OrderStatusUpdateSerializer,
    PaymentSerializer, PaymentDetailSerializer, PaymentInitiateSerializer,
    PaymentInquiryRequestSerializer
)
from shop.models import Product
from accounts.models import UserProfile
from .notifications import send_purchase_notification_email, send_payment_confirmation_email, send_product_access_granted_email
from spotplayer.services import provision_licenses_for_order
from accounts.permissions import IsAdmin, IsTeacherOrAdmin
from .services.zibal import (
    tomans_to_rials, request_payment_service, verify_payment_service,
    inquiry_payment_service, process_callback_service
)

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract client IP address for payment logging."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')



# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

def grant_product_access(order):
    """Grant access to products when order is paid. Does NOT send emails — callers handle that."""
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

        # Initiate payment via Zibal service
        payment = Payment.objects.create(
            user=request.user,
            order=order,
            amount=tomans_to_rials(order.total_amount),
            description=f"پرداخت سفارش #{order.id}",
        )

        callback_url = f"{settings.SERVER_IP}/finance/payment/callback/"
        mobile = getattr(request.user, 'phone', None)
        ip_address = get_client_ip(request)

        success, payment_url, error = request_payment_service(
            payment=payment,
            callback_url=callback_url,
            mobile=mobile,
            ip_address=ip_address,
        )

        if success and payment_url:
            return Response({
                "order": OrderSerializer(order, context={"request": request}).data,
                "payment_url": payment_url,
                "track_id": payment.track_id,
                "message": "سفارش ایجاد شد. در حال انتقال به درگاه پرداخت زیبال...",
            }, status=status.HTTP_201_CREATED)

        # Payment initiation failed – return order but warn the user
        return Response({
            "order": OrderSerializer(order, context={"request": request}).data,
            "message": f"سفارش ایجاد شد اما مشکلی در اتصال به درگاه پرداخت وجود دارد: {error}",
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def update_status(self, request, pk=None):
        """Update order status (admin only)."""
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
                # Best-effort: create DRM licenses so the checkout never fails.
                provision_licenses_for_order(order)
                try:
                    send_product_access_granted_email(order)
                    send_payment_confirmation_email(order)
                except Exception as e:
                    logger.warning("Email error in update_status: %s", e)

            return Response({
                'message': f'Order status updated to {new_status}',
                'order': OrderSerializer(order).data,
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsTeacherOrAdmin])
    def pending(self, request):
        """Get pending orders (admin/teacher only)."""
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

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field or 'pk'
        val = self.kwargs[lookup_url_kwarg]
        if str(val).isdigit():
            obj = queryset.filter(models.Q(id=val) | models.Q(transaction_code=val)).first()
        else:
            obj = queryset.filter(transaction_code=val).first()
        if not obj:
            from django.http import Http404
            raise Http404("تراکنش یافت نشد.")
        self.check_object_permissions(self.request, obj)
        return obj

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

        # Provision DRM licenses best-effort (outside atomic so HTTP calls
        # cannot block/rollback the order transaction).
        provision_licenses_for_order(order)

        # Send emails outside atomic block
        try:
            send_product_access_granted_email(order)
        except Exception as e:
            logger.warning("Email error in perform_create: %s", e)


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
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
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
    Body: {
        "order_id": <int>,
        "description": "<optional>",
        "mobile": "<optional>",
        "national_code": "<optional>",
        "check_mobile_with_card": <bool>,
        "allowed_cards": [<string>]
    }

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

        payment = Payment.objects.create(
            user=request.user,
            order=order,
            amount=tomans_to_rials(order.total_amount),
            description=description,
        )

        callback_url = f"{settings.SERVER_IP}/finance/payment/callback/"
        ip_address = get_client_ip(request)

        mobile = serializer.validated_data.get('mobile') or getattr(request.user, 'phone', None)
        national_code = serializer.validated_data.get('national_code')
        check_mobile = serializer.validated_data.get('check_mobile_with_card', False)
        allowed_cards = serializer.validated_data.get('allowed_cards')

        success, payment_url, error = request_payment_service(
            payment=payment,
            callback_url=callback_url,
            mobile=mobile,
            national_code=national_code,
            check_mobile_with_card=check_mobile,
            allowed_cards=allowed_cards,
            description=description,
            ip_address=ip_address,
        )

        if not success or not payment_url:
            return Response(
                {"error": f"خطا در دریافت لینک پرداخت: {error}"},
                status=status.HTTP_502_BAD_GATEWAY
            )

        return Response({
            "payment_url": payment_url,
            "track_id": payment.track_id,
            "payment": PaymentSerializer(payment).data,
        })


class PaymentCallbackView(APIView):
    """
    GET or POST /finance/payment/callback/
    Zibal redirects or posts here after payment with params:
        trackId, success, status, orderId, cardNumber, hashedCardNumber

    Stores raw callback data, verifies with Zibal, updates DB, and redirects user to frontend.
    """
    permission_classes = [permissions.AllowAny]

    def _handle_callback(self, request, callback_data):
        FRONTEND_URL = settings.FRONTEND_BASE_URL
        track_id_param = callback_data.get('trackId')
        success_param = callback_data.get('success')
        ip_address = get_client_ip(request)

        if not track_id_param:
            logger.warning("Zibal callback received without trackId")
            return redirect(f"{FRONTEND_URL}/payment/failed")

        try:
            track_id = int(track_id_param)
        except (TypeError, ValueError):
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id_param}")

        try:
            payment = Payment.objects.get(track_id=track_id)
        except Payment.DoesNotExist:
            logger.error("Zibal callback – no Payment found for trackId=%s", track_id)
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id}")

        # Store full callback data & log
        process_callback_service(payment, callback_data, ip_address=ip_address)

        # Guard against double-processing if already successful
        if payment.status == Payment.PaymentStatus.SUCCESS:
            ref = payment.ref_number or ''
            return redirect(f"{FRONTEND_URL}/payment/success?refNumber={ref}&trackId={track_id}")

        # Up-front failure check
        if str(success_param) != '1':
            payment.status = Payment.PaymentStatus.FAILED
            payment.save()
            logger.warning("Zibal callback – payment failed upfront for trackId=%s", track_id)
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id}")

        # Execute Zibal Verify
        verified, verify_data, error_msg = verify_payment_service(payment, ip_address=ip_address)

        if verified:
            ref_number = payment.ref_number or str(verify_data.get('refNumber', ''))

            if payment.order:
                with transaction.atomic():
                    payment.order.status = Order.OrderStatus.PAID
                    payment.order.save()

                    Transaction.objects.create(
                        order=payment.order,
                        amount=payment.order.total_amount,
                        transaction_type=Transaction.TransactionType.PURCHASE,
                        payment_method=Transaction.PaymentMethod.ONLINE_PAYMENT,
                        reference_number=ref_number,
                        description=f"پرداخت آنلاین زیبال - شماره پیگیری: {ref_number}",
                        created_by=payment.user,
                    )

                    grant_product_access(payment.order)

                provision_licenses_for_order(payment.order)

                try:
                    send_product_access_granted_email(payment.order)
                except Exception as e:
                    logger.warning("Could not send product access email: %s", e)
                try:
                    send_payment_confirmation_email(payment.order)
                except Exception as e:
                    logger.warning("Could not send payment confirmation email: %s", e)

            return redirect(f"{FRONTEND_URL}/payment/success?refNumber={ref_number}&trackId={track_id}")
        else:
            logger.warning("Zibal verify failed for trackId=%s – %s", track_id, error_msg)
            return redirect(f"{FRONTEND_URL}/payment/failed?trackId={track_id}")

    def get(self, request):
        data = request.GET.dict()
        return self._handle_callback(request, data)

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else request.POST.dict()
        return self._handle_callback(request, data)


class PaymentInquiryView(APIView):
    """
    POST /finance/payment/inquiry/
    Body: { "track_id": <int> } OR { "order_id": <int> }

    Inquires real-time status of a Zibal payment session, updates Payment model & logs,
    and returns full saved metadata and raw Zibal payloads.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentInquiryRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        track_id = serializer.validated_data.get('track_id')
        order_id = serializer.validated_data.get('order_id')

        payment = None
        if track_id:
            payment = Payment.objects.filter(track_id=track_id).first()
        elif order_id:
            payment = Payment.objects.filter(order_id=order_id).order_by('-created_at').first()

        if not payment:
            return Response({"error": "تراکنش پرداخت یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        # Permission check: must be owner or admin/teacher
        if request.user.role not in ('admin', 'teacher') and payment.user != request.user:
            return Response({"error": "شما دسترسی به این تراکنش ندارید."}, status=status.HTTP_403_FORBIDDEN)

        ip_address = get_client_ip(request)
        success, inquiry_data, error_msg = inquiry_payment_service(payment, ip_address=ip_address)

        if not success and not inquiry_data:
            return Response({"error": f"خطا در استعلام زیبال: {error_msg}"}, status=status.HTTP_502_BAD_GATEWAY)

        # If inquiry confirms transaction success and order is not paid yet, fulfill order
        if payment.status == Payment.PaymentStatus.SUCCESS and payment.order and payment.order.status != Order.OrderStatus.PAID:
            ref_number = payment.ref_number or ''
            with transaction.atomic():
                payment.order.status = Order.OrderStatus.PAID
                payment.order.save()

                Transaction.objects.get_or_create(
                    order=payment.order,
                    reference_number=ref_number,
                    defaults={
                        'amount': payment.order.total_amount,
                        'transaction_type': Transaction.TransactionType.PURCHASE,
                        'payment_method': Transaction.PaymentMethod.ONLINE_PAYMENT,
                        'description': f"پرداخت آنلاین زیبال (استعلام) - شماره پیگیری: {ref_number}",
                        'created_by': payment.user,
                    }
                )
                grant_product_access(payment.order)

            provision_licenses_for_order(payment.order)

        return Response({
            "inquiry_success": success,
            "message": error_msg or "استعلام با موفقیت انجام شد.",
            "payment": PaymentDetailSerializer(payment).data
        })

