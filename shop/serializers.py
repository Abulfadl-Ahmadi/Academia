from rest_framework import serializers
from .models import Product, Discount
from accounts.serializers import UserSerializer


class ProductSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True, required=False)
    current_price = serializers.ReadOnlyField()
    has_active_discount = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'price', 'current_price',
            'product_type', 'created_at', 'updated_at', 'creator',
            'is_active', 'image', 'file', 'course', 'test',
            'has_active_discount'
        ]
        read_only_fields = ['creator', 'created_at', 'updated_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'title', 'description', 'price', 'product_type',
            'image', 'file', 'course', 'test'
        ]


class DiscountSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    is_expired = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = Discount
        fields = [
            'id', 'product', 'code', 'percentage', 'expire_at',
            'created_at', 'creator', 'is_active', 'max_uses',
            'used_count', 'is_expired', 'is_available'
        ]
        read_only_fields = ['creator', 'created_at', 'used_count']


class DiscountCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = ['product', 'code', 'percentage', 'expire_at', 'max_uses']


class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    discount_code = serializers.CharField(required=False, allow_blank=True)


class CartSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Cart cannot be empty")
        return value
