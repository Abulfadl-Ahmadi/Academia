from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, DiscountViewSet, CartView, 
    PurchaseView, UserAccessView, CartManagementView,
    shop_page_view
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'discounts', DiscountViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('page/', shop_page_view, name='shop-page'),
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/manage/', CartManagementView.as_view(), name='cart-manage'),
    path('purchase/', PurchaseView.as_view(), name='purchase'),
    path('access/', UserAccessView.as_view(), name='user-access'),
]
