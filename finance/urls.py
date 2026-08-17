from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, TransactionViewSet, UserAccessViewSet,
    AdminDashboardView, ProductAccessCheckView, PaymentInitiateView,
    PaymentCallbackView, PaymentInquiryView, PaymentInfoView,
    SMSNotificationConfigViewSet, SMSNotificationLogViewSet
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'user-access', UserAccessViewSet, basename='useraccess')
router.register(r'sms-notifications', SMSNotificationConfigViewSet, basename='sms-notification')
router.register(r'sms-notification-logs', SMSNotificationLogViewSet, basename='sms-notification-log')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('check-access/', ProductAccessCheckView.as_view(), name='check-access'),
    path('payment/initiate/', PaymentInitiateView.as_view(), name='payment-initiate'),
    path('payment/callback/', PaymentCallbackView.as_view(), name='payment-callback'),
    path('payment/inquiry/', PaymentInquiryView.as_view(), name='payment-inquiry'),
    path('payment/info/', PaymentInfoView.as_view(), name='payment-info'),
]
