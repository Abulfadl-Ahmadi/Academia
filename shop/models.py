from django.db import models
from accounts.models import User
from django.utils.translation import gettext_lazy as _
from contents.models import File
from courses.models import Course
from tests.models import TestCollection
from django.utils import timezone


class Product(models.Model):
    class ProductType(models.TextChoices):
        FILE = 'file', _('File')
        COURSE = 'course', _('Course')
        TEST = 'test', _('Test')
        BOOK = 'book', _('Book')
        NOTEBOOK = 'notebook', _('Notebook') 
        PAMPHLET = 'pamphlet', _('Pamphlet')
        STATIONERY = 'stationery', _('Stationery')
    
    title = models.CharField(max_length=100)
    description = models.TextField()
    price = models.IntegerField()  # Price in Tomans
    product_type = models.CharField(choices=ProductType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    
    # Digital product relations
    file = models.ForeignKey(File, on_delete=models.CASCADE, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    test = models.ForeignKey(TestCollection, on_delete=models.CASCADE, null=True, blank=True)
    
    # Physical product fields
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Weight in grams")
    dimensions = models.CharField(max_length=100, null=True, blank=True, help_text="L x W x H in cm")
    stock_quantity = models.IntegerField(default=0, help_text="Available stock for physical products")
    requires_shipping = models.BooleanField(default=False, help_text="True for physical products")
    shipping_cost = models.IntegerField(default=0, help_text="Shipping cost in Tomans")
    
    def __str__(self):
        return f"{self.title} - {self.get_product_type_display()}"
    
    @property
    def current_price(self):
        """Get current price considering active discounts"""
        active_discount = self.discounts.filter(
            expire_at__gt=timezone.now(),
            is_active=True
        ).first()
        
        if active_discount:
            discount_amount = (self.price * active_discount.percentage) // 100
            return self.price - discount_amount
        return self.price
    
    @property
    def has_active_discount(self):
        return self.discounts.filter(
            expire_at__gt=timezone.now(),
            is_active=True
        ).exists()
    
    @property
    def is_physical_product(self):
        """Check if this is a physical product that requires shipping"""
        physical_types = [self.ProductType.BOOK, self.ProductType.NOTEBOOK, 
                         self.ProductType.PAMPHLET, self.ProductType.STATIONERY]
        return self.product_type in physical_types or self.requires_shipping
    
    @property
    def is_digital_product(self):
        """Check if this is a digital product"""
        return not self.is_physical_product
    
    def save(self, *args, **kwargs):
        # Auto-set requires_shipping for physical products
        if self.is_physical_product:
            self.requires_shipping = True
        super().save(*args, **kwargs)


class Discount(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='discounts')
    code = models.CharField(max_length=100, unique=True)
    percentage = models.IntegerField()  # Discount percentage
    expire_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    max_uses = models.IntegerField(default=0)  # 0 means unlimited
    used_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.code} - {self.percentage}%"
    
    @property
    def is_expired(self):
        return timezone.now() > self.expire_at
    
    @property
    def is_available(self):
        if not self.is_active or self.is_expired:
            return False
        if self.max_uses > 0 and self.used_count >= self.max_uses:
            return False
        return True
    
    def use_discount(self):
        """Mark discount as used"""
        if self.is_available:
            self.used_count += 1
            self.save()
            return True
        return False
