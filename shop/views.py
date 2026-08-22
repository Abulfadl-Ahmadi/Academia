from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404, redirect, render
from django.db import transaction
from django.utils import timezone
from django.urls import reverse
from .models import Product, Discount, Coupon
from .serializers import (
    ProductSerializer, ProductCreateSerializer, DiscountSerializer,
    DiscountCreateSerializer, CartSerializer, CartItemSerializer,
    CouponSerializer, CouponValidateSerializer
)
from finance.models import Order, OrderItem, UserAccess
from finance.serializers import OrderSerializer, PurchaseRequestSerializer
from accounts.utils import send_verification_email
from django.conf import settings


from .utils import user_has_product_access


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

        # Check if user already owns this digital product
        if user_has_product_access(request.user, product):
            return Response(
                {
                    "error": f"شما قبلاً به محصول «{product.title}» دسترسی دارید و نیازی به خرید مجدد آن نیست.",
                    "already_purchased": True,
                    "product_id": product.id,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if product.is_digital_product:
            quantity = 1
        
        # Get or initialize cart from session
        if 'cart' not in request.session:
            request.session['cart'] = {}
        
        cart = request.session['cart']
        product_id = str(product.id)
        
        # Add or update quantity in cart
        if product_id in cart:
            if product.is_digital_product:
                cart[product_id]['quantity'] = 1
            else:
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


class CouponViewSet(viewsets.ModelViewSet):
    """
    Management of Coupons for Instructors/Admins.
    Includes POST /api/shop/coupons/validate/ action for code validation.
    """
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ('admin', 'teacher', 'finance') or user.is_staff or user.is_superuser:
            if getattr(user, 'role', None) in ('admin', 'finance') or user.is_staff or user.is_superuser:
                return Coupon.objects.all()
            return Coupon.objects.filter(created_by=user)
        return Coupon.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def validate(self, request):
        """
        POST /api/shop/coupons/validate/
        Request Body: { "code": "SUMMER50", "course_id": 123, "total_amount": 100000, "product_ids": [1, 2] }
        """
        serializer = CouponValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code_val = serializer.validated_data['code'].strip().upper()
        course_id = serializer.validated_data.get('course_id')
        product_ids = serializer.validated_data.get('product_ids') or []
        total_amount = serializer.validated_data.get('total_amount', 0)

        try:
            coupon = Coupon.objects.get(code=code_val, is_active=True)
        except Coupon.DoesNotExist:
            return Response(
                {"error": "کد تخفیف وارد شده معتبر نیست."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not coupon.is_available:
            if coupon.is_expired:
                return Response(
                    {"error": "مهلت استفاده از این کد تخفیف به پایان رسیده است."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if coupon.max_uses > 0 and coupon.used_count >= coupon.max_uses:
                return Response(
                    {"error": "تعداد دفعات استفاده از این کد تخفیف تمام شده است."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {"error": "این کد تخفیف غیرفعال است."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check course constraints if coupon has course restrictions
        if coupon.courses.exists():
            allowed_course_ids = set(coupon.courses.values_list('id', flat=True))
            is_course_matched = False

            if course_id and course_id in allowed_course_ids:
                is_course_matched = True

            if product_ids:
                cart_course_ids = set(
                    Product.objects.filter(id__in=product_ids, course__isnull=False)
                    .values_list('course_id', flat=True)
                )
                if cart_course_ids.intersection(allowed_course_ids):
                    is_course_matched = True

            if not is_course_matched and (course_id or product_ids):
                return Response(
                    {"error": "این کد تخفیف برای دوره‌ها یا محصولات انتخابی شما معتبر نیست."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if total_amount > 0 and total_amount < coupon.min_purchase_amount:
            return Response(
                {"error": f"حداقل مبلغ سفارش برای اعمال این کد تخفیف {coupon.min_purchase_amount:,} تومان است."},
                status=status.HTTP_400_BAD_REQUEST
            )

        discount_amount = coupon.calculate_discount(total_amount)
        final_total = max(0, total_amount - discount_amount)

        return Response({
            "valid": True,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "discount_amount": discount_amount,
            "final_total": final_total,
            "coupon": CouponSerializer(coupon).data
        })


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

        # Check if user already owns this digital product
        if user_has_product_access(request.user, product):
            return Response(
                {
                    "error": f"شما قبلاً به محصول «{product.title}» دسترسی دارید.",
                    "already_purchased": True,
                    "product_id": product.id,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if product.is_digital_product:
            quantity = 1
        
        # Get or initialize cart from session
        if 'cart' not in request.session:
            request.session['cart'] = {}
        
        cart = request.session['cart']
        product_id = str(product.id)
        
        # Add or update quantity in cart
        if product_id in cart:
            if product.is_digital_product:
                cart[product_id]['quantity'] = 1
            else:
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
            try:
                prod = Product.objects.get(id=product_id, is_active=True, is_deleted=False)
                if prod.is_digital_product and quantity > 1:
                    return Response(
                        {"error": f"محصول دیجیتال «{prod.title}» فقط به تعداد ۱ عدد قابل انتخاب است."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Product.DoesNotExist:
                pass

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
        seen_digital_product_ids = set()
        
        for item_data in items:
            try:
                product = Product.objects.get(
                    id=item_data['product_id'],
                    is_active=True,
                    is_deleted=False
                )
                
                quantity = item_data['quantity']
                
                # Check digital product duplicate & quantity limits
                if product.is_digital_product:
                    if product.id in seen_digital_product_ids:
                        continue  # deduplicate within same request
                    seen_digital_product_ids.add(product.id)

                    if quantity > 1:
                        return Response(
                            {"error": f"محصول دیجیتال «{product.title}» فقط به تعداد ۱ عدد قابل خرید است."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if user_has_product_access(request.user, product):
                        return Response(
                            {
                                "error": f"شما قبلاً به محصول «{product.title}» دسترسی دارید و امکان خرید مجدد وجود ندارد.",
                                "already_purchased": True,
                                "product_id": product.id
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

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
        
        # Check overall coupon code
        coupon_code = request.data.get('coupon_code') or request.data.get('coupon')
        coupon_obj = None
        if coupon_code:
            code_val = str(coupon_code).strip().upper()
            try:
                coupon_obj = Coupon.objects.get(code=code_val, is_active=True)
                if coupon_obj.is_available:
                    coupon_discount = coupon_obj.calculate_discount(total_amount)
                    total_amount = max(0, total_amount - coupon_discount)
                else:
                    coupon_obj = None
            except Coupon.DoesNotExist:
                coupon_obj = None

        # Calculate 10% tax
        if total_amount > 0:
            tax_amount = int(total_amount * 0.10)
            total_amount += tax_amount

        if total_amount < 0:
            return Response(
                {"error": "Invalid total amount"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle free products (total_amount = 0)
        if total_amount == 0:
            # Create order with PAID status for free products
            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                status=Order.OrderStatus.PAID
            )
            if coupon_obj:
                coupon_obj.used_count += 1
                coupon_obj.save()
            
            # Create order items
            for item_data in order_items:
                OrderItem.objects.create(
                    order=order,
                    product=item_data['product'],
                    quantity=item_data['quantity'],
                    price=item_data['price'],
                    discount_amount=item_data['discount_amount']
                )
            
            # Grant access to digital products and enroll student
            from finance.views import grant_product_access
            grant_product_access(order)
            
            # Create transaction record for free purchase
            from finance.models import Transaction
            Transaction.objects.create(
                order=order,
                amount=0,
                transaction_type=Transaction.TransactionType.PURCHASE,
                payment_method=Transaction.PaymentMethod.CASH,  # Free purchase
                description="خرید رایگان محصول",
                created_by=request.user
            )
            
            return Response({
                'message': 'محصولات رایگان با موفقیت خریداری شد',
                'order': OrderSerializer(order).data,
                'free_purchase': True
            }, status=status.HTTP_201_CREATED)
        
        # Zibal minimum is 1,000 Rials → 100 Tomans. We check against 100 Tomans.
        if total_amount < 100:
            return Response(
                {"error": "حداقل مبلغ پرداخت 100 تومان است"},
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
        if coupon_obj:
            coupon_obj.used_count += 1
            coupon_obj.save()

        # Create order items
        for item_data in order_items:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                quantity=item_data['quantity'],
                price=item_data['price'],
                discount_amount=item_data['discount_amount']
            )

        # Initiate Zibal payment
        from finance.services.zibal import request_payment_service, tomans_to_rials
        from finance.models import Payment

        callback_url = f"{settings.BACKEND_BASE_URL}/api/finance/payment/callback/"
        mobile = getattr(request.user, 'phone', None)
        description = f"خرید محصولات - سفارش {order.id}"

        payment = Payment.objects.create(
            user=request.user,
            order=order,
            amount=tomans_to_rials(total_amount),
            description=description,
            status=Payment.PaymentStatus.PENDING,
        )

        success, payment_url, error = request_payment_service(
            payment=payment,
            callback_url=callback_url,
            mobile=mobile,
            description=description
        )

        if success:
            return Response({
                'message': 'در حال انتقال به درگاه پرداخت زیبال...',
                'payment_url': payment_url,
                'track_id': payment.track_id,
                'order': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': f'خطا در اتصال به درگاه پرداخت: {error}'
            }, status=status.HTTP_502_BAD_GATEWAY)

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
