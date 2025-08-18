from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework import viewsets, permissions
from .models import UserProfile, User, VerificationCode
from .serializers import (
    UserProfileSerializer, 
    UserSerializer, 
    SendVerificationCodeSerializer,
    VerifyEmailSerializer,
    CompleteRegistrationSerializer
)
from .utils import send_verification_email
from django.core.cache import cache


class SendVerificationCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Send verification code to email
        """
        serializer = SendVerificationCodeSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            username = serializer.validated_data['username']
            first_name = serializer.validated_data.get('first_name', '')
            last_name = serializer.validated_data.get('last_name', '')
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                return Response(
                    {"error": "نام کاربری قبلاً استفاده شده است"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "ایمیل قبلاً ثبت شده است"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            VerificationCode.objects.filter(email=email).delete()
            # Create verification code
            verification_code = VerificationCode.create_for_email(email)
            
            # Send email
            user_name = f"{first_name} {last_name}".strip() if first_name or last_name else username
            # email_sent = send_verification_email(email, verification_code.code, user_name)
            email_sent = True
            
            if email_sent:
                # Store registration data in cache for 10 minutes
                cache_key = f"registration_data_{email}"
                cache.set(cache_key, serializer.validated_data, 600)  # 10 minutes
                
                return Response({
                    "message": "کد تایید به ایمیل شما ارسال شد",
                    "email": email
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "خطا در ارسال ایمیل. لطفاً دوباره تلاش کنید"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Verify email with code
        """
        serializer = VerifyEmailSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            
            try:
                verification_code = VerificationCode.objects.get(email=email, code=code, is_expired=False).first()
                
                if not verification_code.is_valid():
                    if verification_code.is_expired():
                        return Response(
                            {"error": "کد تایید منقضی شده است"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    else:
                        return Response(
                            {"error": "کد تایید نامعتبر است"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Mark code as used
                verification_code.is_used = True
                verification_code.save()
                
                # Get registration data from cache
                cache_key = f"registration_data_{email}"
                registration_data = cache.get(cache_key)
                
                if not registration_data:
                    return Response(
                        {"error": "داده‌های ثبت‌نام یافت نشد. لطفاً دوباره تلاش کنید"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                return Response({
                    "message": "ایمیل با موفقیت تایید شد",
                    "email": email,
                    "registration_data": registration_data
                }, status=status.HTTP_200_OK)
                
            except VerificationCode.DoesNotExist:
                return Response(
                    {"error": "کد تایید نامعتبر است"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompleteRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Complete registration after email verification
        """
        serializer = CompleteRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # Check if email was verified
            verification_code = (
                VerificationCode.objects
                .filter(email=email, is_used=True)
                .order_by('-created_at')
                .first()
            )

            if not verification_code:
                return Response(
                    {"error": "لطفاً ابتدا ایمیل خود را تایید کنید"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user
            user_data = {
                'username': serializer.validated_data['username'],
                'email': email,
                'password': serializer.validated_data['password'],
                'first_name': serializer.validated_data.get('first_name', ''),
                'last_name': serializer.validated_data.get('last_name', ''),
                'role': User.STUDENT,
                'is_email_verified': True
            }
            
            user = User(**user_data)
            user.set_password(user_data['password'])
            user.save()
            
            # Create profile
            profile_data = {
                'national_id': serializer.validated_data.get('national_id', ''),
                'phone_number': serializer.validated_data.get('phone_number', ''),
                'birth_date': serializer.validated_data.get('birth_date'),
                'grade': serializer.validated_data.get('grade', ''),
            }
            
            profile = UserProfile.objects.create(user=user, **profile_data)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Clear cache
            cache_key = f"registration_data_{email}"
            cache.delete(cache_key)
            
            response = Response({
                "message": "ثبت‌نام با موفقیت انجام شد",
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "is_email_verified": user.is_email_verified
                }
            }, status=status.HTTP_201_CREATED)
            
            # Set tokens in HttpOnly cookies
            response.set_cookie(
                key="access",
                value=str(refresh.access_token),
                httponly=True,
                secure=False,  # Set to True in production (HTTPS)
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=False,
            )
            
            return response
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Register a new user with student as default role
        """
        serializer = UserProfileSerializer(data=request.data)
        if serializer.is_valid():
            profile = serializer.save()
            
            # Generate tokens for the new user
            user = profile.user
            refresh = RefreshToken.for_user(user)
            
            response = Response({
                "message": "Registration successful",
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role
                }
            }, status=status.HTTP_201_CREATED)
            
            # Set tokens in HttpOnly cookies
            response.set_cookie(
                key="access",
                value=str(refresh.access_token),
                httponly=True,
                secure=False,  # Set to True in production (HTTPS)
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=False,
            )
            
            return response
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileViewSet(viewsets.ModelViewSet):
    '''
Example POST JSON body:
{
  "user": {
    "username": "sara2025",
    "email": "sara@example.com",
    "password": "safePass123",
    "first_name": "Sara",
    "last_name": "Amiri"
    // role is optional and defaults to 'student'
  },
  "national_id": "1234567890",
  "phone_number": "09123456789",
  "birth_date": "2007-02-11",
  "grade": "11"
}

    '''
    queryset = UserProfile.objects.select_related('user').all()
    serializer_class = UserProfileSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return []  # Allow unauthenticated access to register
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'admin':
            return self.queryset
        return self.queryset.filter(user=user)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny] 
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)

            response = Response({
                "message": "Login successful",
            }, status=status.HTTP_200_OK)

            # Set tokens in HttpOnly cookies
            response.set_cookie(
                key="access",
                value=str(refresh.access_token),
                httponly=True,
                secure=False,       # Set to True in production (HTTPS)
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=False,
            )
            print(response.cookies)
            return response
        print(f"Failed login attempt for username: {username}")
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class RefreshTokenView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            raise AuthenticationFailed("No refresh token provided")

        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token

            response = Response({"message": "Access token refreshed"})
            response.set_cookie(
                key="access",
                value=str(access),
                httponly=True,
                secure=True,
                samesite="Lax"
            )
            return response
        except Exception:
            raise AuthenticationFailed("Invalid or expired refresh token")


class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        response.delete_cookie("access")
        response.delete_cookie("refresh")
        return response

