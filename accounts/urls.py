# urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, 
    UserProfileViewSet, 
    RefreshTokenView, 
    LogoutView, 
    RegisterView,
    SendVerificationCodeView,
    SendPhoneVerificationCodeView,
    VerifyEmailView,
    VerifyPhoneView,
    CompleteRegistrationView,
    UserDetailView
)

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)
urlpatterns = router.urls

urlpatterns += [
    path('register/', RegisterView.as_view()),
    path('send-verification/', SendVerificationCodeView.as_view()),
    path('send-phone-verification/', SendPhoneVerificationCodeView.as_view()),
    path('verify-email/', VerifyEmailView.as_view()),
    path('verify-phone/', VerifyPhoneView.as_view()),
    path('complete-registration/', CompleteRegistrationView.as_view()),
    path('login/', LoginView.as_view()),
    path('token/refresh/', RefreshTokenView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('user/', UserDetailView.as_view()),
]
