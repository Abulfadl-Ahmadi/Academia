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
        """Use OrderCreateSerializer for input, but return OrderSerializer as output."""
        input_serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        input_serializer.is_valid(raise_exception=True)
        order = input_serializer.save()

        # Send notification email to admin when order is created (best-effort)
        try:
            send_purchase_notification_email(order)
        except Exception:
            pass

        # Initiate payment automatically
        try:
            # Prepare Zarinpal request
            callback_url = f"{settings.SERVER_IP}/finance/payment/callback/"
            zarinpal_data = {
                "merchant_id": settings.ZARINPAL_MERCHANT_ID,
                "amount": order.total_amount,
                "callback_url": callback_url,
                "description": f'پرداخت سفارش #{order.id}'
            }

            response = requests.post(settings.ZARINPAL_REQUEST_URL, json=zarinpal_data, timeout=10)
            result = response.json()

            if result.get("data") and result["data"].get("authority"):
                authority = result["data"]["authority"]
                Payment.objects.create(
                    user=request.user,
                    order=order,
                    amount=order.total_amount,
                    description=f'پرداخت سفارش #{order.id}',
                    authority=authority
                )
                payment_url = f"{settings.ZARINPAL_STARTPAY_URL}{authority}"
                
                return Response({
                    "order": OrderSerializer(order, context={"request": request}).data,
                    "payment_url": payment_url,
                    "authority": authority,
                    "message": "سفارش ایجاد شد. در حال انتقال به درگاه پرداخت..."
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    "order": OrderSerializer(order, context={"request": request}).data,
                    "message": "سفارش ایجاد شد اما مشکلی در ایجاد درگاه پرداخت وجود دارد. لطفاً دوباره تلاش کنید."
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                "order": OrderSerializer(order, context={"request": request}).data,
                "message": "سفارش ایجاد شد اما مشکلی در اتصال به درگاه پرداخت وجود دارد. لطفاً دوباره تلاش کنید."
            }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status (admin only)"""
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
            
            # Update order status
            order.status = new_status
            if admin_notes:
                order.admin_notes = admin_notes
            order.save()
            
            # If order is paid, grant access to products
            if new_status == Order.OrderStatus.PAID:
                self.grant_product_access(order)
                # Send confirmation email to student
                send_payment_confirmation_email(order)
            
            return Response({
                'message': f'Order status updated to {new_status}',
                'order': OrderSerializer(order).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending orders (admin only)"""
        if request.user.role != 'admin' and request.user.role != 'teacher':
            return Response(
                {"error": "Only admins can view pending orders"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_orders = Order.objects.filter(
            status=Order.OrderStatus.PENDING
        ).select_related('user').prefetch_related('items__product')
        
        serializer = OrderSerializer(pending_orders, many=True)
        return Response(serializer.data)

    def grant_product_access(self, order):
        """Grant access to products when order is paid"""
        for item in order.items.all():
            # Check if user already has access
            access, created = UserAccess.objects.get_or_create(
                user=order.user,
                product=item.product,
                defaults={
                    'order': order,
                    'is_active': True
                }
            )

            course = item.product.course
            if course:
                course.students.add(order.user)
                course.save()
            
            if not created:
                # Update existing access
                access.order = order
                access.is_active = True
                access.save()
        
        # Send product access granted email
        send_product_access_granted_email(order)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'teacher':
            return Transaction.objects.all().select_related('order', 'created_by')
        return Transaction.objects.filter(order__user=user).select_related('order', 'created_by')

    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            # Save the transaction
            transaction_obj = serializer.save(created_by=self.request.user)
            
            # Update order status to PAID
            order = transaction_obj.order
            order.status = Order.OrderStatus.PAID
            order.save()
            print(order.id, ":", order.status)
            
            # Grant product access
            self.grant_product_access(order)
            
            # Check if user has national ID and update order status to CONFIRMED
            try:
                user_profile = UserProfile.objects.get(user=order.user)
                if user_profile.national_id:
                    order.status = Order.OrderStatus.CONFIRMED
                    order.save()
            except UserProfile.DoesNotExist:
                pass

    def grant_product_access(self, order):
        """Grant access to products when order is paid"""
        for item in order.items.all():
            # Check if user already has access
            access, created = UserAccess.objects.get_or_create(
                user=order.user,
                product=item.product,
                defaults={
                    'order': order,
                    'is_active': True
                }
            )

            course = item.product.course
            if course:
                course.students.add(order.user)
                course.save()
            
            if not created:
                # Update existing access
                access.order = order
                access.is_active = True
                access.save()
        
        # Send product access granted email
        send_product_access_granted_email(order)


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
            'product__test'
        )

    @action(detail=False, methods=['get'])
    def my_products(self, request):
        """Get current user's accessible products"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get admin dashboard statistics"""
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can access dashboard"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get statistics
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status=Order.OrderStatus.PENDING).count()
        total_revenue = sum(order.total_amount for order in Order.objects.filter(status=Order.OrderStatus.PAID))
        
        # Recent orders
        recent_orders = Order.objects.order_by('-created_at')[:10]
        
        # Recent transactions
        recent_transactions = Transaction.objects.order_by('-created_at')[:10]
        
        return Response({
            'statistics': {
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'total_revenue': total_revenue,
                'paid_orders': Order.objects.filter(status=Order.OrderStatus.PAID).count()
            },
            'recent_orders': OrderSerializer(recent_orders, many=True).data,
            'recent_transactions': TransactionSerializer(recent_transactions, many=True).data
        })


class ProductAccessCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Check if user has access to a product"""
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response(
                {"error": "product_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has access
        try:
            access = UserAccess.objects.get(
                user=request.user,
                product=product,
                is_active=True
            )
            
            if access.is_expired:
                return Response({
                    "has_access": False,
                    "message": "Access has expired"
                })
            
            return Response({
                "has_access": True,
                "access": UserAccessSerializer(access).data
            })
            
        except UserAccess.DoesNotExist:
            return Response({
                "has_access": False,
                "message": "Product not purchased"
            })


class PaymentInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order_id = serializer.validated_data['order_id']
        # For security, always use the server-calculated amount from the order
        description = serializer.validated_data.get('description', f'پرداخت سفارش #{order_id}')

        # Get the order
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "سفارش یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        # Check if order is already paid
        if order.status == Order.OrderStatus.PAID:
            return Response({"error": "این سفارش قبلاً پرداخت شده است"}, status=status.HTTP_400_BAD_REQUEST)


        # Prepare Zarinpal request (single correct version)
        callback_url = f"{settings.SERVER_IP} /finance/payment/callback/"
        zarinpal_data = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": order.total_amount,
            "callback_url": callback_url,
            "description": description
        }

        try:
            response = requests.post(settings.ZARINPAL_REQUEST_URL, json=zarinpal_data, timeout=10)
            result = response.json()
        except Exception as e:
            return Response({"error": f"خطا در ارتباط با درگاه پرداخت: {e}"}, status=status.HTTP_502_BAD_GATEWAY)

        if result.get("data") and result["data"].get("authority"):
            authority = result["data"]["authority"]
            payment = Payment.objects.create(
                user=request.user,
                order=order,
                amount=order.total_amount,
                description=description,
                authority=authority
            )
            startpay_url = f"{settings.ZARINPAL_STARTPAY_URL}{authority}"
            return Response({"payment_url": startpay_url, "authority": authority})
        else:
            error_message = result.get("errors", ["خطا در دریافت کد پرداخت"])[0]
            return Response({"error": error_message}, status=status.HTTP_502_BAD_GATEWAY)

        # Prepare Zarinpal request
        callback_url = f"{settings.SERVER_IP}/finance/payment/callback/"
        zarinpal_data = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": order.total_amount,
            "callback_url": callback_url,
            "description": description
        }

        try:
            response = requests.post(settings.ZARINPAL_REQUEST_URL, json=zarinpal_data, timeout=10)
            response_data = response.json()

            if response_data.get('data', {}).get('code') == 100:
                authority = response_data['data']['authority']
                payment.authority = authority
                payment.save()

                payment_url = f"{settings.ZARINPAL_START_PAY_URL}{authority}"
                return Response({
                    "payment_url": payment_url,
                    "authority": authority
                })
            else:
                payment.status = Payment.PaymentStatus.FAILED
                payment.save()
                return Response({
                    "error": "خطا در ایجاد پرداخت",
                    "code": response_data.get('data', {}).get('code')
                }, status=status.HTTP_400_BAD_REQUEST)

        except requests.RequestException as e:
            payment.status = Payment.PaymentStatus.FAILED
            payment.save()
            return Response({"error": "خطا در اتصال به درگاه پرداخت"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        authority = request.GET.get('Authority')
        status_param = request.GET.get('Status')

        FRONTEND_URL = settings.FRONTEND_BASE_URL
        if not authority or status_param != 'OK':
            return redirect(f"{FRONTEND_URL}/payment/failed?authority={authority}")

        try:
            payment = Payment.objects.get(authority=authority)
        except Payment.DoesNotExist:
            return redirect(f"{FRONTEND_URL}/payment/failed?authority={authority}")

        # Verify payment with Zarinpal
        verify_data = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "authority": authority,
            "amount": payment.amount
        }

        try:
            response = requests.post(settings.ZARINPAL_VERIFY_URL, json=verify_data, timeout=10)
            response_data = response.json()

            if response_data.get('data', {}).get('code') == 100:
                ref_id = response_data['data']['ref_id']
                payment.ref_id = ref_id
                payment.status = Payment.PaymentStatus.SUCCESS
                payment.save()

                # Update order status
                if payment.order:
                    payment.order.status = Order.OrderStatus.PAID
                    payment.order.save()

                    # Create transaction record
                    Transaction.objects.create(
                        order=payment.order,
                        amount=payment.amount,
                        transaction_type=Transaction.TransactionType.PURCHASE,
                        payment_method=Transaction.PaymentMethod.ONLINE_PAYMENT,
                        reference_number=ref_id,
                        description=f"پرداخت آنلاین - کد پیگیری: {ref_id}",
                        created_by=payment.user
                    )

                    # Grant product access
                    for item in payment.order.items.all():
                        access, created = UserAccess.objects.get_or_create(
                            user=payment.user,
                            product=item.product,
                            order=payment.order,
                            defaults={'is_active': True}
                        )
                        if not created and not access.is_active:
                            access.is_active = True
                            access.save()
                        # Add user to course.students if not already
                        course = getattr(item.product, 'course', None)
                        if course and not course.students.filter(id=payment.user.id).exists():
                            course.students.add(payment.user)

                    # Send confirmation email
                    send_payment_confirmation_email(payment.order)

                return redirect(f"{FRONTEND_URL}/payment/success?ref_id={ref_id}")
            else:
                payment.status = Payment.PaymentStatus.FAILED
                payment.save()
                return redirect(f"{FRONTEND_URL}/payment/failed?authority={authority}")

        except requests.RequestException:
            payment.status = Payment.PaymentStatus.FAILED
            payment.save()
            return redirect(f"{FRONTEND_URL}/payment/failed?authority={authority}")
