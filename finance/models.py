from django.db import models
from django.utils import timezone
from accounts.models import User
from shop.models import Product
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
import secrets
import string


def generate_unique_code(prefix: str) -> str:
    """Generate a secure, non-sequential unique code like TRX-8F4B92C1 or ORD-93A17B42."""
    alphabet = string.ascii_uppercase + string.digits
    random_str = ''.join(secrets.choice(alphabet) for _ in range(8))
    return f"{prefix}-{random_str}"


def default_sms_trigger_statuses():
    return ['paid']


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        CONFIRMED = 'confirmed', _('Confirmed')
        PAID = 'paid', _('Paid')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_code = models.CharField(max_length=50, unique=True, db_index=True, null=True, blank=True)
    total_amount = models.IntegerField()  # Total amount in Tomans
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at', '-id']
    
    def save(self, *args, **kwargs):
        if not self.order_code:
            code = generate_unique_code("ORD")
            while Order.objects.filter(order_code=code).exists():
                code = generate_unique_code("ORD")
            self.order_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_code or self.id} - {self.user.username} - {self.status}"

    @property
    def order_items(self):
        return list(self.items.all())


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.IntegerField()  # Price at the time of purchase
    discount_amount = models.IntegerField(default=0)  # Discount amount in Tomans
    
    def __str__(self):
        return f"{self.product.title} - {self.order.id}"


class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        PURCHASE = 'purchase', _('Purchase')
        REFUND = 'refund', _('Refund')
        CREDIT = 'credit', _('Credit')
        DEBIT = 'debit', _('Debit')

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', _('Cash')
        BANK_TRANSFER = 'bank_transfer', _('Bank Transfer')
        CREDIT_CARD = 'credit_card', _('Credit Card')
        ONLINE_PAYMENT = 'online_payment', _('Online Payment')

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    transaction_code = models.CharField(max_length=50, unique=True, db_index=True, null=True, blank=True)
    amount = models.IntegerField()  # Amount in Tomans
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    reference_number = models.CharField(max_length=100, blank=True, null=True)  # Bank reference, receipt number, etc.
    description = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_transactions')
    
    class Meta:
        ordering = ['-created_at', '-id']
    
    def save(self, *args, **kwargs):
        if not self.transaction_code:
            code = generate_unique_code("TRX")
            while Transaction.objects.filter(transaction_code=code).exists():
                code = generate_unique_code("TRX")
            self.transaction_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Transaction {self.transaction_code or self.id} - {self.order.id} - {self.amount} Tomans"


class UserAccess(models.Model):
    """Track user access to purchased products"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_access')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='access_records')
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # For time-limited access
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'product']
    
    def __str__(self):
        return f"{self.user.username} - {self.product.title}"
    
    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at


class Payment(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        SUCCESS = 'success', _('Success')
        FAILED = 'failed', _('Failed')
        CANCELLED = 'cancelled', _('Cancelled')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    order_id_str = models.CharField(max_length=100, blank=True, null=True)  # Unique order reference string sent to Zibal
    amount = models.BigIntegerField()  # Amount in Rials (Zibal uses Rials)
    track_id = models.BigIntegerField(unique=True, null=True, blank=True)  # Zibal trackId
    ref_number = models.CharField(max_length=100, blank=True, null=True)  # Zibal refNumber after verify
    card_number = models.CharField(max_length=20, blank=True, null=True)  # Masked card number (62741****44)
    hashed_card_number = models.CharField(max_length=255, blank=True, null=True)  # Hashed card number (for lazy method)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    
    # Zibal Specific Status & Result Codes
    zibal_status = models.IntegerField(null=True, blank=True)  # Zibal status (-1, 1, 2, 3, 4, 5, etc.)
    result_code = models.IntegerField(null=True, blank=True)   # Zibal result code (100, 102, 201, 202, 203, etc.)
    result_message = models.CharField(max_length=255, blank=True, null=True)

    # Zibal Timestamps
    paid_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    zibal_created_at = models.DateTimeField(null=True, blank=True)

    # Financial & Configuration Info
    wage = models.IntegerField(null=True, blank=True)  # Fee mode or fee amount returned by Zibal
    multiplexing_data = models.JSONField(default=list, blank=True)  # Multiplexing / split details
    mobile = models.CharField(max_length=20, blank=True, null=True)
    national_code = models.CharField(max_length=20, blank=True, null=True)
    check_mobile_with_card = models.BooleanField(default=False)
    allowed_cards = models.JSONField(default=list, blank=True)

    # Raw Payload Storage for Full Audit & Inquiry
    raw_request_payload = models.JSONField(null=True, blank=True)
    raw_request_response = models.JSONField(null=True, blank=True)
    raw_callback_payload = models.JSONField(null=True, blank=True)
    raw_verify_response = models.JSONField(null=True, blank=True)
    raw_inquiry_response = models.JSONField(null=True, blank=True)

    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"Payment #{self.id} - {self.user.username} - {self.amount} Rials - Track: {self.track_id} - Status: {self.status}"


class PaymentLog(models.Model):
    class ActionType(models.TextChoices):
        REQUEST = 'request', _('Payment Request')
        CALLBACK = 'callback', _('Callback Received')
        VERIFY = 'verify', _('Payment Verify')
        INQUIRY = 'inquiry', _('Payment Inquiry')

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=ActionType.choices)
    zibal_status = models.IntegerField(null=True, blank=True)
    result_code = models.IntegerField(null=True, blank=True)
    request_data = models.JSONField(null=True, blank=True)
    response_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PaymentLog #{self.id} - Payment #{self.payment.id} - Action: {self.action} at {self.created_at}"


class SMSNotificationConfig(models.Model):
    """Configuration for automatic SMS notifications on product sales"""
    
    class TriggerStatus(models.TextChoices):
        PAID = 'paid', _('Paid')
        CONFIRMED = 'confirmed', _('Confirmed')

    class MessageType(models.TextChoices):
        BULK = 'bulk', _('Bulk SMS')
        VERIFY = 'verify', _('Pattern SMS')
    
    name = models.CharField(max_length=100, verbose_name="نام تنظیمات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    message_type = models.CharField(
        max_length=20, choices=MessageType.choices,
        default=MessageType.BULK, verbose_name="نوع پیامک"
    )
    template_id = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="شناسه الگوی ارسال"
    )
    template_parameters = models.JSONField(
        default=dict, blank=True, verbose_name="پارامترهای الگو",
        help_text="یک دیکشنری از نام پارامتر به یکی از متغیرهای قالب سفارش"
    )
    
    # Trigger conditions
    product_types = models.JSONField(
        default=list, blank=True,
        verbose_name="نوع محصولات",
        help_text="خالی بگذارید برای همه نوع محصولات. مثال: ['course', 'book', 'file']"
    )
    min_order_amount = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="حداقل مبلغ سفارش (تومان)",
        help_text="فقط سفارش‌هایی با مبلغ بالاتر از این مقدار"
    )
    trigger_statuses = models.JSONField(
        default=default_sms_trigger_statuses,
        verbose_name="وضعیت سفارش برای ارسال",
        help_text="چه وضعیت‌هایی باعث ارسال پیامک شود"
    )
    
    # SMS content template
    template_text = models.TextField(
        verbose_name="متن پیامک",
        help_text="متن پیامک با متغیرهای: {order_code}, {customer_name}, {customer_phone}, {total_amount}, {product_titles}, {product_types}, {order_date}, {items_count}"
    )
    
    # Recipients
    admin_users = models.ManyToManyField(
        User,
        blank=True,
        limit_choices_to={'role__in': ['admin', 'finance']},
        verbose_name="کاربران ادمین/مالی",
        related_name='sms_notification_configs'
    )
    custom_phone_numbers = models.JSONField(
        default=list, blank=True,
        verbose_name="شماره تلفن‌های سفارشی",
        help_text="لیست شماره‌های موبایل (فرمت: 09xxxxxxxxx)"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_sms_configs', verbose_name="ایجادکننده"
    )
    
    class Meta:
        verbose_name = "تنظیمات گزارش خودکار SMS"
        verbose_name_plural = "گزارش‌های خودکار SMS"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({'فعال' if self.is_active else 'غیرفعال'})"

    def clean(self):
        super().clean()
        if not (self.template_text or '').strip():
            raise ValidationError({'template_text': 'متن پیامک الزامی است.'})
        if self.message_type == self.MessageType.VERIFY and not self.template_id:
            raise ValidationError({'template_id': 'برای پیامک الگویی، شناسه الگو الزامی است.'})
        invalid_statuses = set(self.trigger_statuses or []) - {
            self.TriggerStatus.PAID, self.TriggerStatus.CONFIRMED,
        }
        if invalid_statuses:
            raise ValidationError({'trigger_statuses': 'فقط وضعیت‌های paid و confirmed مجاز هستند.'})
        for phone in self.custom_phone_numbers or []:
            try:
                RegexValidator(r'^09\d{9}$')(phone)
            except (TypeError, ValidationError):
                raise ValidationError({'custom_phone_numbers': f'شماره نامعتبر است: {phone}'})
    
    def get_recipient_phones(self):
        """Get all phone numbers to send SMS to"""
        phones = []
        
        # From admin users
        for user in self.admin_users.all():
            # Try user profile phone
            if hasattr(user, 'profile') and user.profile.phone_number:
                phones.append(user.profile.phone_number)
            # Try user address phone
            if hasattr(user, 'address') and user.address.phone_number:
                phones.append(user.address.phone_number)
        
        # From custom phone numbers
        phones.extend(self.custom_phone_numbers or [])
        
        # Keep a stable order while removing duplicates and invalid values.
        return list(dict.fromkeys(phone for phone in phones if isinstance(phone, str) and phone))
    
    def matches_order(self, order):
        """Check if this config should trigger for the given order"""
        if not self.is_active:
            return False
        
        # Check order status
        if order.status not in (self.trigger_statuses or []):
            return False
        
        # Check minimum amount
        if self.min_order_amount and order.total_amount < self.min_order_amount:
            return False
        
        # Check product types
        if self.product_types:
            order_product_types = set(item.product.product_type for item in order.items.all())
            if not order_product_types.intersection(set(self.product_types)):
                return False
        
        return True
    
    def render_template(self, order):
        """Render SMS template with order data"""
        context = self.get_template_context(order)
        try:
            return self.template_text.format(**context)
        except (KeyError, ValueError):
            return self.template_text

    def get_template_context(self, order):
        product_titles = ", ".join(item.product.title for item in order.items.all())
        product_types = ", ".join(set(item.product.get_product_type_display() for item in order.items.all()))
        
        context = {
            'order_code': order.order_code or str(order.id),
            'customer_name': order.user.get_full_name() or order.user.username,
            'customer_phone': getattr(order.user, 'phone', '') or 
                             (order.user.profile.phone_number if hasattr(order.user, 'profile') else '') or
                             (order.user.address.phone_number if hasattr(order.user, 'address') else ''),
            'total_amount': f"{order.total_amount:,}",
            'product_titles': product_titles,
            'product_types': product_types,
            'order_date': order.created_at.strftime('%Y/%m/%d %H:%M'),
            'items_count': order.items.count(),
        }
        return context


class SMSNotificationLog(models.Model):
    class Status(models.TextChoices):
        SUCCESS = 'success', _('Success')
        FAILED = 'failed', _('Failed')

    config = models.ForeignKey(SMSNotificationConfig, on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='logs')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL,
                              null=True, blank=True, related_name='sms_logs')
    phone_number = models.CharField(max_length=11)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices)
    error_message = models.TextField(blank=True)
    provider_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        indexes = [models.Index(fields=['status', '-created_at'])]

    def __str__(self):
        return f'{self.phone_number} - {self.status} - {self.created_at:%Y-%m-%d %H:%M}'

