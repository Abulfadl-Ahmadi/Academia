from django.db import models
from accounts.models import User
from django.utils.translation import gettext_lazy as _
from contents.models import File
from courses.models import Course
from tests.models import Test
from django.utils import timezone


class Product(models.Model):
    class ProductType(models.TextChoices):
        FILE = 'file', _('File')
        COURSE = 'course', _('Course')
        TEST = 'test', _('Test')
    
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
    file = models.ForeignKey(File, on_delete=models.CASCADE, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    test = models.ForeignKey(Test, on_delete=models.CASCADE, null=True, blank=True)
    
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
