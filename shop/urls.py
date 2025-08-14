from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, DiscountViewSet, CartView, 
    PurchaseView, UserAccessView
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'discounts', DiscountViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('cart/', CartView.as_view(), name='cart'),
    path('purchase/', PurchaseView.as_view(), name='purchase'),
    path('access/', UserAccessView.as_view(), name='user-access'),
]
