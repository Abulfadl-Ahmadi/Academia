from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import Order, OrderItem, Transaction, UserAccess
from courses.models import Course
from .serializers import (
    OrderSerializer, OrderCreateSerializer, TransactionSerializer,
    TransactionCreateSerializer, UserAccessSerializer, OrderStatusUpdateSerializer
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
            return Order.objects.all().select_related('user').prefetch_related('items')
        return Order.objects.filter(user=user).select_related('user').prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        order = serializer.save()
        # Send notification email to admin when order is created
        send_purchase_notification_email(order)

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
