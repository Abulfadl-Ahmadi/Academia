from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile, VerificationCode

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_email_verified', 'is_staff')
    list_filter = ('role', 'is_email_verified', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'is_email_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role', 'is_email_verified')}),
    )

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'national_id', 'phone_number', 'grade')
    search_fields = ('user__username', 'user__email', 'national_id', 'phone_number')
    list_filter = ('grade',)

class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'created_at', 'expires_at', 'is_used', 'is_expired')
    list_filter = ('is_used', 'created_at')
    search_fields = ('email', 'code')
    readonly_fields = ('created_at',)

    def is_expired(self, obj):
        return obj.is_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expired'

admin.site.register(User, CustomUserAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(VerificationCode, VerificationCodeAdmin)
