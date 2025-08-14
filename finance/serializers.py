from rest_framework import serializers
from .models import Order, OrderItem, Transaction, UserAccess
from shop.serializers import ProductSerializer
from accounts.serializers import UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'discount_amount']


class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'total_amount', 'status', 'created_at',
            'updated_at', 'admin_notes', 'items'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['total_amount']


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
