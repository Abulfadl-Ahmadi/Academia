from rest_framework import serializers
from .models import (
    Order, OrderItem, Transaction, UserAccess, Payment, PaymentLog,
    SMSNotificationConfig, SMSNotificationLog,
)
from shop.models import Product, Discount
from shop.serializers import ProductSerializer
from accounts.serializers import UserSerializer


class SMSNotificationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSNotificationConfig
        fields = [
            'id', 'name', 'is_active', 'message_type', 'template_id',
            'template_parameters', 'product_types', 'min_order_amount',
            'trigger_statuses', 'template_text', 'admin_users',
            'custom_phone_numbers', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance or SMSNotificationConfig()
        for field, value in attrs.items():
            if field != 'admin_users':
                setattr(instance, field, value)
        instance.clean()
        return attrs


class SMSNotificationLogSerializer(serializers.ModelSerializer):
    config_name = serializers.CharField(source='config.name', read_only=True)
    order_code = serializers.CharField(source='order.order_code', read_only=True)

    class Meta:
        model = SMSNotificationLog
        fields = [
            'id', 'config', 'config_name', 'order', 'order_code',
            'phone_number', 'message', 'status', 'error_message',
            'provider_response', 'created_at',
        ]


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
            'id', 'order_code', 'user', 'total_amount', 'status', 'created_at',
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
    payments = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_code', 'order', 'amount', 'transaction_type', 'payment_method',
            'reference_number', 'description', 'admin_notes', 'created_at',
            'created_by', 'payments'
        ]
        read_only_fields = ['created_at', 'created_by']

    def get_payments(self, obj):
        try:
            PaymentSerializer = globals().get('PaymentSerializer')
            if PaymentSerializer is None:
                class _PaymentSerializer(serializers.ModelSerializer):
                    class Meta:
                        model = Payment
                        fields = ['id', 'track_id', 'ref_number', 'card_number', 'amount', 'status', 'description', 'created_at', 'updated_at']
                PaymentSerializer = _PaymentSerializer
            payments_qs = obj.order.payments.all() if getattr(obj, 'order', None) else []
            return PaymentSerializer(payments_qs, many=True).data
        except Exception:
            return []


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


class PaymentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentLog
        fields = [
            'id', 'action', 'zibal_status', 'result_code',
            'request_data', 'response_data', 'ip_address', 'created_at'
        ]
        read_only_fields = fields


class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'order', 'order_id_str', 'amount', 'track_id', 'ref_number',
            'card_number', 'status', 'zibal_status', 'result_code', 'result_message',
            'paid_at', 'verified_at', 'zibal_created_at', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class PaymentDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    order = OrderSerializer(read_only=True)
    logs = PaymentLogSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'order', 'order_id_str', 'amount', 'track_id', 'ref_number',
            'card_number', 'hashed_card_number', 'status', 'zibal_status', 'result_code',
            'result_message', 'paid_at', 'verified_at', 'zibal_created_at', 'wage',
            'multiplexing_data', 'mobile', 'national_code', 'check_mobile_with_card',
            'allowed_cards', 'raw_request_payload', 'raw_request_response',
            'raw_callback_payload', 'raw_verify_response', 'raw_inquiry_response',
            'description', 'created_at', 'updated_at', 'logs'
        ]
        read_only_fields = fields


class PaymentInitiateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    description = serializers.CharField(max_length=255, required=False)
    mobile = serializers.CharField(max_length=20, required=False)
    national_code = serializers.CharField(max_length=20, required=False)
    check_mobile_with_card = serializers.BooleanField(default=False, required=False)
    allowed_cards = serializers.ListField(child=serializers.CharField(max_length=20), required=False)


class PaymentInquiryRequestSerializer(serializers.Serializer):
    track_id = serializers.IntegerField(required=False)
    order_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if not attrs.get('track_id') and not attrs.get('order_id'):
            raise serializers.ValidationError("باید حداقل یکی از فیلدهای track_id یا order_id ارسال شود.")
        return attrs

