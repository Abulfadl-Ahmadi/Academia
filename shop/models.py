from django.db import models
from accounts.models import User
from django.utils.translation import gettext_lazy as _


class Product(models.Model):
    class ProductType(models.TextChoices):
        FILE = 'file', _('File')
        COURSE = 'course', _('Course')
        TEST = 'test', _('Test')
    title = models.CharField(max_length=100)
    description = models.TextField()
    price = models.IntegerField()
    product_type = models.CharField(choices=ProductType.choices)


class Discount(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    code = models.CharField(max_length=100)
    percentage = models.IntegerField()
    expire_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
