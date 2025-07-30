# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)
urlpatterns = router.urls

urlpatterns += [
    path('login/', LoginView.as_view()),
    path('token/refresh/', RefreshTokenView.as_view()),
    path('logout/', LogoutView.as_view()),
]
