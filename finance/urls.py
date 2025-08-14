from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, TransactionViewSet, UserAccessViewSet,
    AdminDashboardView, ProductAccessCheckView
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'user-access', UserAccessViewSet, basename='useraccess')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('check-access/', ProductAccessCheckView.as_view(), name='check-access'),
]
