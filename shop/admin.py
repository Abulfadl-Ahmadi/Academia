from django.contrib import admin
from .models import Product, Discount


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'product_type', 'price', 'creator', 'is_active', 'created_at')
    list_filter = ('product_type', 'is_active', 'is_deleted', 'created_at')
    search_fields = ('title', 'description', 'creator__username', 'creator__email')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_active', 'price')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'price', 'product_type')
        }),
        ('Content', {
            'fields': ('file', 'course', 'test', 'image')
        }),
        ('Status', {
            'fields': ('is_active', 'is_deleted')
        }),
        ('Metadata', {
            'fields': ('creator', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('code', 'product', 'percentage', 'is_active', 'is_expired', 'used_count', 'max_uses')
    list_filter = ('is_active', 'created_at', 'expire_at')
    search_fields = ('code', 'product__title')
    readonly_fields = ('created_at', 'used_count', 'is_expired', 'is_available')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('product', 'code', 'percentage')
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'used_count')
        }),
        ('Timing', {
            'fields': ('expire_at', 'is_expired')
        }),
        ('Status', {
            'fields': ('is_active', 'is_available')
        }),
        ('Metadata', {
            'fields': ('creator', 'created_at'),
            'classes': ('collapse',)
        }),
    )
