from rest_framework import serializers
from .models import Order, OrderItem, Transaction, UserAccess, Payment
from shop.models import Product, Discount
from shop.serializers import ProductSerializer
from accounts.serializers import UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'discount_amount']


class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'total_amount', 'status', 'created_at',
            'updated_at', 'admin_notes', 'items'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_items(self, obj):
        return OrderItemSerializer(obj.items.all(), many=True).data


class OrderCreateSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )
    
    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data['items']
        
        # Calculate total amount and create order items
        total_amount = 0
        order_items = []
        
        for item_data in items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity', 1)
            discount_code = item_data.get('discount_code')
            
            try:
                product = Product.objects.get(id=product_id, is_active=True, is_deleted=False)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with id {product_id} not found")
            
            price = product.current_price
            discount_amount = 0
            
            # Apply discount if provided
            if discount_code:
                try:
                    discount = Discount.objects.get(
                        code=discount_code,
                        is_active=True,
                        is_available=True
                    )
                    if discount.is_expired:
                        raise serializers.ValidationError("Discount code has expired")
                    discount_amount = (price * discount.percentage) / 100
                except Discount.DoesNotExist:
                    raise serializers.ValidationError("Invalid discount code")
            
            item_total = (price - discount_amount) * quantity
            total_amount += item_total
            
            order_items.append({
                'product': product,
                'quantity': quantity,
                'price': price,
                'discount_amount': discount_amount
            })
        
        # Add tax (9.9%)
        tax_amount = total_amount * 0.099
        total_amount += tax_amount
        
        # Create order
        order = Order.objects.create(
            user=user,
            total_amount=int(total_amount)
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
        
        # Fetch order with items
        order = Order.objects.prefetch_related('items__product').get(id=order.id)
        
        return order


class TransactionSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'order', 'amount', 'transaction_type', 'payment_method',
            'reference_number', 'description', 'admin_notes', 'created_at',
            'created_by'
        ]
        read_only_fields = ['created_at', 'created_by']


class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'order', 'amount', 'transaction_type', 'payment_method',
            'reference_number', 'description', 'admin_notes'
        ]


class UserAccessSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = UserAccess
        fields = [
            'id', 'user', 'product', 'order', 'granted_at',
            'expires_at', 'is_active', 'is_expired'
        ]
        read_only_fields = ['user', 'product', 'order', 'granted_at']


class PurchaseRequestSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_items(self, value):
        for item in value:
            if 'product_id' not in item:
                raise serializers.ValidationError("Each item must have a product_id")
            if 'quantity' not in item:
                item['quantity'] = 1
            if item['quantity'] < 1:
                raise serializers.ValidationError("Quantity must be at least 1")
        return value


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.OrderStatus.choices)
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'order', 'amount', 'authority', 'ref_id',
            'status', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class PaymentInitiateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    amount = serializers.IntegerField(min_value=1000)  # Minimum 1000 Tomans
    description = serializers.CharField(max_length=255, required=False)
