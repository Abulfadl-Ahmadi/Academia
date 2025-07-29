# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/login/', LoginView.as_view()),
    path('api/token/refresh/', RefreshTokenView.as_view()),
    path('api/logout/', LogoutView.as_view()),
]
