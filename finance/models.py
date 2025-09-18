from django.db import models
from django.utils import timezone
from accounts.models import User
from shop.models import Product
from django.utils.translation import gettext_lazy as _


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        CONFIRMED = 'confirmed', _('Confirmed')
        PAID = 'paid', _('Paid')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.IntegerField()  # Total amount in Tomans
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Order #{self.id} - {self.user.username} - {self.status}"

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
    amount = models.IntegerField()  # Amount in Tomans
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    reference_number = models.CharField(max_length=100, blank=True, null=True)  # Bank reference, receipt number, etc.
    description = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_transactions')
    
    def __str__(self):
        return f"Transaction #{self.id} - {self.order.id} - {self.amount} Tomans"


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
    amount = models.IntegerField()  # Amount in Tomans
    authority = models.CharField(max_length=100, unique=True)  # Zarinpal authority
    ref_id = models.CharField(max_length=100, blank=True, null=True)  # Reference ID from Zarinpal
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} - {self.user.username} - {self.amount} Tomans - {self.status}"
