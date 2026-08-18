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
    UserDetailView,
    UserAddressView,
    SendResetPasswordCodeView,
    VerifyResetPasswordCodeView,
    ResetPasswordView,
    ChangePasswordView,
    AdminUserViewSet,
    ProfileStatusView
)

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
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
    path('address/', UserAddressView.as_view()),
    path('send-reset-password/', SendResetPasswordCodeView.as_view()),
    path('verify-reset-password/', VerifyResetPasswordCodeView.as_view()),
    path('reset-password/', ResetPasswordView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    path('profile/complete/', ProfileStatusView.as_view()),
]
