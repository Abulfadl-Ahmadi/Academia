from django.contrib import admin
from django.contrib.admin import AdminSite
from django.urls import reverse
from django.utils.html import format_html


class AcademiaAdminSite(AdminSite):
    site_header = "سیستم مدیریت آرین تفضلی‌زاده"
    site_title = "پنل مدیریت آرین تفضلی‌زاده"
    index_title = "به پنل مدیریت آرین تفضلی‌زاده خوش آمدید"
    
    def each_context(self, request):
        context = super().each_context(request)
        context.update({
            'custom_admin_styles': True,
        })
        return context


# Custom admin site instance
academia_admin_site = AcademiaAdminSite(name='academia_admin')


# Register all apps with the custom admin site
from django.apps import apps

def autodiscover_and_register():
    """Auto-register all models from custom apps with enhanced admin"""
    
    # Import all admin modules
    from accounts.admin import CustomUserAdmin, UserProfileAdmin, VerificationCodeAdmin
    from courses.admin import CourseAdmin, CourseSessionAdmin, CourseScheduleAdmin, ClassCategoryAdmin
    from contents.admin import FileAdmin
    from tests.admin import TestAdmin, PrimaryKeyAdmin, StudentTestSessionAdmin, StudentTestSessionLogAdmin, StudentAnswerAdmin
    from shop.admin import ProductAdmin, DiscountAdmin
    from finance.admin import OrderAdmin, OrderItemAdmin, TransactionAdmin, UserAccessAdmin
    
    # Import models
    from accounts.models import User, UserProfile, VerificationCode
    from courses.models import Course, CourseSession, CourseSchedule, ClassCategory
    from contents.models import File
    from tests.models import Test, PrimaryKey, StudentTestSession, StudentTestSessionLog, StudentAnswer
    from shop.models import Product, Discount
    from finance.models import Order, OrderItem, Transaction, UserAccess
    
    # Register with default admin
    models_and_admins = [
        (User, CustomUserAdmin),
        (UserProfile, UserProfileAdmin),
        (VerificationCode, VerificationCodeAdmin),
        (Course, CourseAdmin),
        (CourseSession, CourseSessionAdmin),
        (CourseSchedule, CourseScheduleAdmin),
        (ClassCategory, ClassCategoryAdmin),
        (File, FileAdmin),
        (Test, TestAdmin),
        (PrimaryKey, PrimaryKeyAdmin),
        (StudentTestSession, StudentTestSessionAdmin),
        (StudentTestSessionLog, StudentTestSessionLogAdmin),
        (StudentAnswer, StudentAnswerAdmin),
        (Product, ProductAdmin),
        (Discount, DiscountAdmin),
        (Order, OrderAdmin),
        (OrderItem, OrderItemAdmin),
        (Transaction, TransactionAdmin),
        (UserAccess, UserAccessAdmin),
    ]
    
    # Register with custom admin site as well
    for model, admin_class in models_and_admins:
        if not academia_admin_site._registry.get(model):
            academia_admin_site.register(model, admin_class)


# Call the function to register everything
autodiscover_and_register()
