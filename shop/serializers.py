from rest_framework import serializers
from .models import Product, Discount, Coupon
from accounts.serializers import UserSerializer
from courses.serializers import CourseSerializer


from .utils import user_has_product_access


class ProductSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True, required=False)
    current_price = serializers.ReadOnlyField()
    has_active_discount = serializers.ReadOnlyField()
    is_physical_product = serializers.ReadOnlyField()
    is_digital_product = serializers.ReadOnlyField()
    has_access = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'price', 'current_price',
            'product_type', 'created_at', 'updated_at', 'creator',
            'is_active', 'image', 'file', 'course', 'test',
            'has_active_discount', 'is_physical_product', 'is_digital_product', 'has_access',
            'weight', 'dimensions', 'stock_quantity', 'requires_shipping', 'shipping_cost'
        ]
        read_only_fields = ['creator', 'created_at', 'updated_at']

    def get_has_access(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return user_has_product_access(request.user, obj)


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'title', 'description', 'price', 'product_type',
            'image', 'file', 'course', 'test', 'weight', 'dimensions', 
            'stock_quantity', 'requires_shipping', 'shipping_cost'
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


class CouponSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    is_expired = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    course_details = CourseSerializer(source='courses', many=True, read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'discount_value',
            'max_uses', 'used_count', 'min_purchase_amount',
            'valid_from', 'valid_until', 'is_active',
            'courses', 'course_details', 'created_by',
            'created_at', 'updated_at', 'is_expired', 'is_available'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'used_count']

    def validate_code(self, value):
        return value.strip().upper()


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    course_id = serializers.IntegerField(required=False, allow_null=True)
    product_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_null=True
    )
    total_amount = serializers.IntegerField(required=False, min_value=0)


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

