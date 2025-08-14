from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import Product, Discount
from .serializers import (
    ProductSerializer, ProductCreateSerializer, DiscountSerializer,
    DiscountCreateSerializer, CartSerializer, CartItemSerializer
)
from finance.models import Order, OrderItem, UserAccess
from finance.serializers import OrderSerializer, PurchaseRequestSerializer
from accounts.utils import send_verification_email
from django.conf import settings


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True, is_deleted=False)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        product_type = self.request.query_params.get('type', None)
        if product_type:
            queryset = queryset.filter(product_type=product_type)
        return queryset

    @action(detail=True, methods=['post'])
    def add_to_cart(self, request, pk=None):
        """Add product to cart (session-based for now)"""
        product = self.get_object()
        quantity = int(request.data.get('quantity', 1))
        
        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For now, we'll just return the product info
        # In a real implementation, you'd store this in session or database
        return Response({
            "message": f"Added {quantity} of {product.title} to cart",
            "product": ProductSerializer(product).data,
            "quantity": quantity
        })


class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return DiscountCreateSerializer
        return DiscountSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        """Validate a discount code"""
        code = request.data.get('code')
        product_id = request.data.get('product_id')
        
        if not code or not product_id:
            return Response(
                {"error": "Both code and product_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            discount = Discount.objects.get(
                code=code,
                product_id=product_id,
                is_active=True
            )
            
            if not discount.is_available:
                return Response(
                    {"error": "Discount code is not available"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                "discount": DiscountSerializer(discount).data,
                "discount_amount": (discount.product.price * discount.percentage) // 100
            })
            
        except Discount.DoesNotExist:
            return Response(
                {"error": "Invalid discount code"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Calculate cart total and validate items"""
        serializer = CartSerializer(data=request.data)
        if serializer.is_valid():
            items = serializer.validated_data['items']
            cart_items = []
            total_amount = 0
            
            for item_data in items:
                try:
                    product = Product.objects.get(
                        id=item_data['product_id'],
                        is_active=True,
                        is_deleted=False
                    )
                    
                    quantity = item_data['quantity']
                    price = product.current_price
                    discount_amount = 0
                    
                    # Apply discount if provided
                    if 'discount_code' in item_data and item_data['discount_code']:
                        try:
                            discount = Discount.objects.get(
                                code=item_data['discount_code'],
                                product=product,
                                is_active=True
                            )
                            if discount.is_available:
                                discount_amount = (price * discount.percentage) // 100
                                price -= discount_amount
                        except Discount.DoesNotExist:
                            pass
                    
                    item_total = price * quantity
                    total_amount += item_total
                    
                    cart_items.append({
                        'product': ProductSerializer(product).data,
                        'quantity': quantity,
                        'price': price,
                        'discount_amount': discount_amount,
                        'total': item_total
                    })
                    
                except Product.DoesNotExist:
                    return Response(
                        {"error": f"Product with id {item_data['product_id']} not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            return Response({
                'items': cart_items,
                'total_amount': total_amount
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PurchaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        """Create a purchase request and send email to admin"""
        serializer = PurchaseRequestSerializer(data=request.data)
        if serializer.is_valid():
            items = serializer.validated_data['items']
            
            # Calculate total and validate products
            total_amount = 0
            order_items = []
            
            for item_data in items:
                try:
                    product = Product.objects.get(
                        id=item_data['product_id'],
                        is_active=True,
                        is_deleted=False
                    )
                    
                    quantity = item_data['quantity']
                    price = product.current_price
                    discount_amount = 0
                    
                    # Apply discount if provided
                    if 'discount_code' in item_data and item_data['discount_code']:
                        try:
                            discount = Discount.objects.get(
                                code=item_data['discount_code'],
                                product=product,
                                is_active=True
                            )
                            if discount.is_available:
                                discount_amount = (price * discount.percentage) // 100
                                price -= discount_amount
                                discount.use_discount()
                        except Discount.DoesNotExist:
                            pass
                    
                    item_total = price * quantity
                    total_amount += item_total
                    
                    order_items.append({
                        'product': product,
                        'quantity': quantity,
                        'price': price,
                        'discount_amount': discount_amount
                    })
                    
                except Product.DoesNotExist:
                    return Response(
                        {"error": f"Product with id {item_data['product_id']} not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Create order
            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                status=Order.OrderStatus.PENDING
            )
            
            # Create order items
            for item_data in order_items:
                OrderItem.objects.create(
                    order=order,
                    product=item_data['product'],
                    quantity=item_data['quantity'],
                    price=item_data['price'],
                    discount_amount=item_data['discount_amount']
                )
            
            # Send email to admin
            self.send_purchase_notification_email(order)
            
            return Response({
                'message': 'Purchase request created successfully. Admin will contact you soon.',
                'order': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_purchase_notification_email(self, order):
        """Send purchase notification email to admin"""
        try:
            # Get admin users
            from accounts.models import User
            admin_users = User.objects.filter(role=User.ADMIN)
            
            # Prepare email context
            items_data = []
            for item in order.items.all():
                items_data.append({
                    'product_title': item.product.title,
                    'quantity': item.quantity,
                    'price': item.price
                })
            
            context = {
                'order_id': order.id,
                'customer_name': order.user.get_full_name() or order.user.username,
                'customer_email': order.user.email,
                'order_date': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'items': items_data,
                'total_amount': order.total_amount,
                'admin_url': f"http://localhost:8000/admin/finance/order/{order.id}/change/"
            }
            
            # Send email to all admin users
            for admin in admin_users:
                if admin.email:
                    from django.core.mail import send_mail
                    from django.template.loader import render_to_string
                    from django.utils.html import strip_tags
                    
                    subject = f'درخواست خرید جدید - سفارش #{order.id}'
                    
                    # Render HTML template
                    html_message = render_to_string('accounts/purchase_notification.html', context)
                    
                    # Create plain text version
                    plain_message = strip_tags(html_message)
                    
                    send_mail(
                        subject=subject,
                        message=plain_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[admin.email],
                        html_message=html_message,
                        fail_silently=False,
                    )
                    
        except Exception as e:
            print(f"Error sending purchase notification email: {e}")


class UserAccessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user's purchased products"""
        user_access = UserAccess.objects.filter(
            user=request.user,
            is_active=True
        ).select_related('product', 'order')
        
        from finance.serializers import UserAccessSerializer
        serializer = UserAccessSerializer(user_access, many=True)
        
        return Response({
            'purchased_products': serializer.data
        })

    def post(self, request):
        """Check if user has access to a specific product"""
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response(
                {"error": "product_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            access = UserAccess.objects.get(
                user=request.user,
                product_id=product_id,
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
