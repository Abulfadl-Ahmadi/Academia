from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404, redirect, render
from django.db import transaction
from django.utils import timezone
from django.urls import reverse
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
        """Add product to cart (session-based for non-authenticated users)"""
        product = self.get_object()
        quantity = int(request.data.get('quantity', 1))
        
        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or initialize cart from session
        if 'cart' not in request.session:
            request.session['cart'] = {}
        
        cart = request.session['cart']
        product_id = str(product.id)
        
        # Add or update quantity in cart
        if product_id in cart:
            cart[product_id]['quantity'] += quantity
        else:
            cart[product_id] = {
                'quantity': quantity,
                'product_title': product.title,
                'product_price': product.current_price
            }
        
        request.session['cart'] = cart
        request.session.modified = True
        
        return Response({
            "message": f"Added {quantity} of {product.title} to cart",
            "product": ProductSerializer(product).data,
            "quantity": cart[product_id]['quantity'],
            "cart_items_count": sum(item['quantity'] for item in cart.values())
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
    permission_classes = [permissions.AllowAny]  # Allow both authenticated and anonymous users

    def get(self, request):
        """Get current cart contents"""
        cart = request.session.get('cart', {})
        cart_items = []
        total_amount = 0
        
        for product_id, item_data in cart.items():
            try:
                product = Product.objects.get(
                    id=product_id,
                    is_active=True,
                    is_deleted=False
                )
                
                quantity = item_data['quantity']
                price = product.current_price
                item_total = price * quantity
                total_amount += item_total
                
                cart_items.append({
                    'product': ProductSerializer(product).data,
                    'quantity': quantity,
                    'price': price,
                    'total': item_total
                })
                
            except Product.DoesNotExist:
                # Remove invalid product from cart
                del cart[product_id]
                request.session['cart'] = cart
                request.session.modified = True
        
        return Response({
            'items': cart_items,
            'total_amount': total_amount,
            'items_count': len(cart_items)
        })

    def post(self, request):
        """Calculate cart total and validate items (for authenticated users) or initiate purchase flow"""
        if not request.user.is_authenticated:
            # For unauthenticated users, store cart and redirect to registration
            return self._handle_unauthenticated_checkout(request)
        
        # Existing cart calculation logic for authenticated users
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
    
    def _handle_unauthenticated_checkout(self, request):
        """Handle checkout for unauthenticated users"""
        cart = request.session.get('cart', {})
        
        if not cart:
            return Response(
                {"error": "Cart is empty"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store the cart in session with a special key for post-registration retrieval
        request.session['pending_cart'] = cart
        request.session.modified = True
        
        # Return redirect information to frontend
        register_url = request.build_absolute_uri(reverse('accounts:register'))
        
        return Response({
            "redirect_to_register": True,
            "register_url": "/accounts/register/",
            "message": "Please register or login to complete your purchase",
            "cart_items_count": len(cart)
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Clear cart"""
        if 'cart' in request.session:
            del request.session['cart']
            request.session.modified = True
        
        return Response({"message": "Cart cleared successfully"})


class CartManagementView(APIView):
    """View for managing cart items (add, remove, update quantity)"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Add item to cart"""
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response(
                {"error": "product_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(
                id=product_id,
                is_active=True,
                is_deleted=False
            )
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or initialize cart from session
        if 'cart' not in request.session:
            request.session['cart'] = {}
        
        cart = request.session['cart']
        product_id = str(product.id)
        
        # Add or update quantity in cart
        if product_id in cart:
            cart[product_id]['quantity'] += quantity
        else:
            cart[product_id] = {
                'quantity': quantity,
                'product_title': product.title,
                'product_price': product.current_price
            }
        
        request.session['cart'] = cart
        request.session.modified = True
        
        return Response({
            "message": f"Added {quantity} of {product.title} to cart",
            "product": ProductSerializer(product).data,
            "quantity": cart[product_id]['quantity'],
            "cart_items_count": sum(item['quantity'] for item in cart.values())
        })
    
    def put(self, request):
        """Update item quantity in cart"""
        product_id = str(request.data.get('product_id'))
        quantity = int(request.data.get('quantity', 0))
        
        if not product_id:
            return Response(
                {"error": "product_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart = request.session.get('cart', {})
        
        if product_id not in cart:
            return Response(
                {"error": "Product not in cart"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if quantity <= 0:
            # Remove item from cart
            del cart[product_id]
            message = "Item removed from cart"
        else:
            # Update quantity
            cart[product_id]['quantity'] = quantity
            message = f"Updated quantity to {quantity}"
        
        request.session['cart'] = cart
        request.session.modified = True
        
        return Response({
            "message": message,
            "cart_items_count": sum(item['quantity'] for item in cart.values())
        })
    
    def delete(self, request):
        """Remove item from cart"""
        product_id = str(request.data.get('product_id'))
        
        if not product_id:
            return Response(
                {"error": "product_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart = request.session.get('cart', {})
        
        if product_id not in cart:
            return Response(
                {"error": "Product not in cart"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        del cart[product_id]
        request.session['cart'] = cart
        request.session.modified = True
        
        return Response({
            "message": "Item removed from cart",
            "cart_items_count": sum(item['quantity'] for item in cart.values())
        })


class PurchaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Must be authenticated

    @transaction.atomic
    def post(self, request):
        """Create order and initiate payment with ZarinPal"""
        serializer = PurchaseRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        
        if total_amount <= 0:
            return Response(
                {"error": "Invalid total amount"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ZarinPal minimum amount is 1000 Tomans
        if total_amount < 1000:
            return Response(
                {"error": "حداقل مبلغ پرداخت 1000 تومان است"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if cart contains physical products and validate address
        has_physical_products = any(item_data['product'].is_physical_product for item_data in order_items)
        if has_physical_products:
            from accounts.models import UserAddress
            try:
                user_address = UserAddress.objects.get(user=request.user)
                if not user_address.is_complete:
                    return Response({
                        "error": "incomplete_address",
                        "message": "برای خرید محصولات فیزیکی، تکمیل آدرس الزامی است",
                        "redirect_to": "/panel/address"
                    }, status=status.HTTP_400_BAD_REQUEST)
            except UserAddress.DoesNotExist:
                return Response({
                    "error": "missing_address", 
                    "message": "برای خرید محصولات فیزیکی، وارد کردن آدرس الزامی است",
                    "redirect_to": "/panel/address"
                }, status=status.HTTP_400_BAD_REQUEST)

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

        # Initiate ZarinPal payment
        import requests
        from django.conf import settings
        
        zarinpal_data = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": int(total_amount),
            "callback_url": f"{settings.BACKEND_BASE_URL}/api/finance/payment/callback/",
            "description": f"خرید محصولات - سفارش {order.id}",
            "metadata": {"order_id": str(order.id)}
        }
        
        print(f"ZarinPal Request Data: {zarinpal_data}")
        print(f"ZarinPal URL: {settings.ZARINPAL_REQUEST_URL}")
        
        try:
            response = requests.post(settings.ZARINPAL_REQUEST_URL, json=zarinpal_data, timeout=10)
            response_data = response.json()
            
            print(f"ZarinPal Response Status: {response.status_code}")
            print(f"ZarinPal Response Data: {response_data}")
            
            if response_data.get('data', {}).get('code') == 100:
                authority = response_data['data']['authority']
                
                # Create Payment record
                from finance.models import Payment
                Payment.objects.create(
                    user=request.user,
                    order=order,
                    amount=total_amount,
                    authority=authority,
                    status=Payment.PaymentStatus.PENDING
                )
                
                # Generate payment URL
                payment_url = f"{settings.ZARINPAL_STARTPAY_URL}{authority}"
                
                return Response({
                    'message': 'در حال انتقال به درگاه پرداخت...',
                    'payment_url': payment_url,
                    'authority': authority,
                    'order': OrderSerializer(order).data
                }, status=status.HTTP_201_CREATED)
            else:
                error_message = response_data.get('errors', {})
                print(f"ZarinPal Error: {error_message}")
                return Response({
                    'error': f'خطا در اتصال به درگاه پرداخت: {error_message}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except requests.RequestException as e:
            print(f"ZarinPal Request Exception: {e}")
            return Response({
                'error': f'خطا در اتصال به درگاه پرداخت: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                "access": {
                    "product_id": access.product.id,
                    "expires_at": access.expires_at,
                    "is_active": access.is_active
                }
            })
            
        except UserAccess.DoesNotExist:
            return Response({
                "has_access": False,
                "message": "Product not purchased"
            })


def shop_page_view(request):
    """Render the shop page template"""
    return render(request, 'shop/shop.html')
