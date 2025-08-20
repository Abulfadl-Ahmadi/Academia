from django.contrib import admin
from .models import Order, OrderItem, Transaction, UserAccess


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('price', 'discount_amount')


class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0
    readonly_fields = ('created_at', 'created_by')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'status', 'created_at', 'items_count')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)
    inlines = [OrderItemInline, TransactionInline]
    list_per_page = 25
    
    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'total_amount', 'status')
        }),
        ('Notes', {
            'fields': ('admin_notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Items'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price', 'discount_amount', 'final_amount')
    list_filter = ('order__status', 'product__product_type')
    search_fields = ('order__user__username', 'product__title')
    readonly_fields = ('final_amount',)
    
    def final_amount(self, obj):
        return obj.price - obj.discount_amount
    final_amount.short_description = 'Final Amount'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'amount', 'transaction_type', 'payment_method', 'created_at', 'created_by')
    list_filter = ('transaction_type', 'payment_method', 'created_at')
    search_fields = ('order__user__username', 'reference_number', 'description')
    readonly_fields = ('created_at',)
    list_per_page = 25
    
    fieldsets = (
        ('Transaction Information', {
            'fields': ('order', 'amount', 'transaction_type', 'payment_method')
        }),
        ('Reference', {
            'fields': ('reference_number', 'description')
        }),
        ('Notes', {
            'fields': ('admin_notes',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserAccess)
class UserAccessAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'order', 'is_active', 'is_expired_status', 'granted_at')
    list_filter = ('is_active', 'granted_at', 'product__product_type')
    search_fields = ('user__username', 'product__title', 'order__id')
    readonly_fields = ('granted_at', 'is_expired_status')
    list_per_page = 25
    
    fieldsets = (
        ('Access Information', {
            'fields': ('user', 'product', 'order')
        }),
        ('Status', {
            'fields': ('is_active', 'expires_at', 'is_expired_status')
        }),
        ('Metadata', {
            'fields': ('granted_at',),
            'classes': ('collapse',)
        }),
    )
    
    def is_expired_status(self, obj):
        return obj.is_expired
    is_expired_status.boolean = True
    is_expired_status.short_description = 'Expired'
