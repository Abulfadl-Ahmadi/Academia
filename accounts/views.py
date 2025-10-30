# accounts/views.py
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework import viewsets, permissions
from .models import UserProfile, User, VerificationCode, UserAddress
from .serializers import (
    UserProfileSerializer, 
    UserSerializer, 
    SendVerificationCodeSerializer,
    SendPhoneVerificationCodeSerializer,
    VerifyEmailSerializer,
    VerifyPhoneSerializer,
    CompleteRegistrationSerializer,
    UserAddressSerializer,
    SendResetPasswordCodeSerializer,
    VerifyResetPasswordCodeSerializer,
    ResetPasswordSerializer
)
from .utils import send_verification_email, send_verification_sms, send_reset_password_sms
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
            # username = serializer.validated_data['username']
            # first_name = serializer.validated_data.get('first_name', '')
            # last_name = serializer.validated_data.get('last_name', '')
            
            # # Check if user already exists
            # if User.objects.filter(username=username).exists():
            #     return Response(
            #         {"error": "نام کاربری قبلاً استفاده شده است"}, 
            #         status=status.HTTP_400_BAD_REQUEST
            #     )
            
            # if User.objects.filter(email=email).exists():
            #     return Response(
            #         {"error": "ایمیل قبلاً ثبت شده است"}, 
            #         status=status.HTTP_400_BAD_REQUEST
            #     )
            
            VerificationCode.objects.filter(email=email).delete()
            # Create verification code
            verification_code = VerificationCode.create_for_email(email)
            
            # Send email
            # user_name = f"{first_name} {last_name}".strip() if first_name or last_name else username
            # email_sent = send_verification_email(email, verification_code.code, user_name)
            email_sent = True

            if email_sent:
                # Store registration data in cache for 10 minutes
                # cache_key = f"registration_data_{email}"
                # cache.set(cache_key, serializer.validated_data, 600)  # 10 minutes
                
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


class SendPhoneVerificationCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Send verification code to phone number
        """
        serializer = SendPhoneVerificationCodeSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            
            # Check if phone number is already registered
            if UserProfile.objects.filter(phone_number=phone_number).exists():
                return Response(
                    {"error": "این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            VerificationCode.objects.filter(phone_number=phone_number).delete()
            # Create verification code
            verification_code = VerificationCode.create_for_phone(phone_number)
            
            # Send SMS
            sms_sent = send_verification_sms(phone_number, verification_code.code)
            print("\n\n",20*"-", "sms_sent:", sms_sent)

            if sms_sent:
                return Response({
                    "message": "کد تایید به شماره موبایل شما ارسال شد",
                    "phone_number": phone_number
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید"}, 
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
                verification_code = VerificationCode.objects.get(email=email, code=code)
                
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
                # cache_key = f"registration_data_{email}"
                # registration_data = cache.get(cache_key)
                
                # if not registration_data:
                #     return Response(
                #         {"error": "داده‌های ثبت‌نام یافت نشد. لطفاً دوباره تلاش کنید"}, 
                #         status=status.HTTP_400_BAD_REQUEST
                #     )
                
                return Response({
                    "message": "ایمیل با موفقیت تایید شد",
                    "email": email,
                    # "registration_data": registration_data
                }, status=status.HTTP_200_OK)
                
            except VerificationCode.DoesNotExist:
                return Response(
                    {"error": "کد تایید نامعتبر است"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyPhoneView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Verify phone number with code
        """
        serializer = VerifyPhoneSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            code = serializer.validated_data['code']
            
            try:
                verification_code = VerificationCode.objects.get(phone_number=phone_number, code=code)
                
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
                
                return Response({
                    "message": "شماره موبایل با موفقیت تایید شد",
                    "phone_number": phone_number
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
        Complete registration after phone verification
        """
        serializer = CompleteRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            
            # Check if phone was verified
            verification_code = (
                VerificationCode.objects
                .filter(phone_number=phone_number, is_used=True)
                .order_by('-created_at')
                .first()
            )

            if not verification_code:
                return Response(
                    {"error": "لطفاً ابتدا شماره موبایل خود را تایید کنید"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create user
            user_data = {
                'username': serializer.validated_data['username'],
                'email': serializer.validated_data.get('email', ''),
                'password': serializer.validated_data['password'],
                'first_name': serializer.validated_data.get('first_name', ''),
                'last_name': serializer.validated_data.get('last_name', ''),
                'role': User.STUDENT,
                'is_email_verified': False  # Email not verified yet
            }
            
            user = User(**user_data)
            user.set_password(user_data['password'])
            user.save()
            
            # Create profile
            profile_data = {
                'national_id': serializer.validated_data.get('national_id', ''),
                'phone_number': phone_number,
                'birth_date': serializer.validated_data.get('birth_date'),
                'grade': serializer.validated_data.get('grade', ''),
            }
            
            profile = UserProfile.objects.create(user=user, **profile_data)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Handle pending cart from shop
            pending_cart = request.session.get('pending_cart', {})
            cart_message = ""
            if pending_cart:
                # Move pending cart to regular cart for the authenticated user
                request.session['cart'] = pending_cart
                del request.session['pending_cart']
                request.session.modified = True
                cart_message = f" محصولات انتخابی شما ({len(pending_cart)} محصول) در سبد خرید شما قرار گرفت."
            
            # Clear verification codes
            VerificationCode.objects.filter(phone_number=phone_number).delete()
            
            response = Response({
                "message": f"ثبت‌نام با موفقیت انجام شد.{cart_message}",
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "is_email_verified": user.is_email_verified
                },
                "has_pending_cart": bool(pending_cart),
                "redirect_to_panel": True
            }, status=status.HTTP_201_CREATED)
            
            # Set tokens in HttpOnly cookies
            response.set_cookie(
                key="access",
                value=str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite="None",
                domain=".ariantafazolizadeh.ir"
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite="None",
                domain=".ariantafazolizadeh.ir"
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
            
            # Handle pending cart from shop
            pending_cart = request.session.get('pending_cart', {})
            cart_message = ""
            if pending_cart:
                # Move pending cart to regular cart for the authenticated user
                request.session['cart'] = pending_cart
                del request.session['pending_cart']
                request.session.modified = True
                cart_message = f" Selected products ({len(pending_cart)} items) have been added to your cart."
            
            response = Response({
                "message": f"Registration successful.{cart_message}",
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role
                },
                "has_pending_cart": bool(pending_cart),
                "redirect_to_panel": True
            }, status=status.HTTP_201_CREATED)
            
            # Set tokens in HttpOnly cookies
            response.set_cookie(
                key="access",
                value=str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite="None",
                domain=".ariantafazolizadeh.ir"
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite="None",
                domain=".ariantafazolizadeh.ir"
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
        if username[:2] != "09":
            user = authenticate(username=username, password=password)
        else:
            user_by_username = UserProfile.objects.get(phone_number=username).user.username
            user = authenticate(username=user_by_username, password=password)


        # user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            
            # Check profile completion status
            try:
                profile = user.profile
                profile_completed = bool(profile.national_id and profile.phone_number)
            except UserProfile.DoesNotExist:
                UserProfile.objects.create(user=user)
                profile_completed = False

            # Handle pending cart from shop
            pending_cart = request.session.get('pending_cart', {})
            cart_message = ""
            if pending_cart:
                # Merge pending cart with user's existing cart if any
                current_cart = request.session.get('cart', {})
                for product_id, item in pending_cart.items():
                    if product_id in current_cart:
                        current_cart[product_id]['quantity'] += item['quantity']
                    else:
                        current_cart[product_id] = item
                
                request.session['cart'] = current_cart
                del request.session['pending_cart']
                request.session.modified = True
                cart_message = f" محصولات انتخابی شما ({len(pending_cart)} محصول) در سبد خرید شما قرار گرفت."

            response = Response({
                "message": f"ورود با موفقیت انجام شد.{cart_message}",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "profile_completed": profile_completed
                },
                "has_pending_cart": bool(pending_cart),
                "redirect_to_panel": True if pending_cart else False
            }, status=status.HTTP_200_OK)

            # Set cookie parameters based on environment
            from django.conf import settings
            is_production = not settings.DEBUG
            
            # Set tokens in HttpOnly cookies
            if is_production:
                # Production settings
                response.set_cookie(
                    key="access",
                    value=str(refresh.access_token),
                    httponly=True,
                    secure=True,
                    samesite="None",
                    domain=".ariantafazolizadeh.ir"
                )
                response.set_cookie(
                    key="refresh",
                    value=str(refresh),
                    httponly=True,
                    secure=True,
                    samesite="None",
                    domain=".ariantafazolizadeh.ir"
                )
            else:
                # Development settings
                response.set_cookie(
                    key="access",
                    value=str(refresh.access_token),
                    httponly=True,
                    secure=False,
                    samesite="Lax"
                )
                response.set_cookie(
                    key="refresh",
                    value=str(refresh),
                    httponly=True,
                    secure=False,
                    samesite="Lax"
                )
            print(response.cookies)
            return response
        print(f"Failed login attempt for username: {username}")
        return Response({"error": "نام کاربری یا رمز عبور اشتباه است"}, status=status.HTTP_401_UNAUTHORIZED)


class RefreshTokenView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            raise AuthenticationFailed("No refresh token provided")

        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token

            response = Response({"message": "Access token refreshed"})
            
            # Set cookie parameters based on environment
            from django.conf import settings
            is_production = not settings.DEBUG
            
            if is_production:
                # Production settings
                response.set_cookie(
                    key="access",
                    value=str(access),
                    httponly=True,
                    secure=True,
                    samesite="None",
                    domain=".ariantafazolizadeh.ir"
                )
            else:
                # Development settings
                response.set_cookie(
                    key="access",
                    value=str(access),
                    httponly=True,
                    secure=False,
                    samesite="Lax"
                )
            return response
        except Exception:
            raise AuthenticationFailed("Invalid or expired refresh token")


class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        
        # Set cookie parameters based on environment
        from django.conf import settings
        is_production = not settings.DEBUG
        
        if is_production:
            # Production settings
            response.delete_cookie("access", domain=".ariantafazolizadeh.ir")
            response.delete_cookie("refresh", domain=".ariantafazolizadeh.ir")
        else:
            # Development settings
            response.delete_cookie("access")
            response.delete_cookie("refresh")
        return response


class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get current user details"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update current user details"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAddressView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's address"""
        try:
            address = UserAddress.objects.get(user=request.user)
            serializer = UserAddressSerializer(address)
            return Response(serializer.data)
        except UserAddress.DoesNotExist:
            return Response(
                {"message": "آدرس کاربر یافت نشد"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def post(self, request):
        """Create or update user's address"""
        try:
            address = UserAddress.objects.get(user=request.user)
            serializer = UserAddressSerializer(address, data=request.data, partial=True)
        except UserAddress.DoesNotExist:
            serializer = UserAddressSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        """Update user's address"""
        try:
            address = UserAddress.objects.get(user=request.user)
            serializer = UserAddressSerializer(address, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserAddress.DoesNotExist:
            return Response(
                {"message": "آدرس کاربر یافت نشد"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class SendResetPasswordCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Send reset password verification code to phone number
        """
        serializer = SendResetPasswordCodeSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            
            # Check if phone number exists in user profiles
            try:
                user_profile = UserProfile.objects.get(phone_number=phone_number)
            except UserProfile.DoesNotExist:
                return Response(
                    {"error": "شماره موبایل یافت نشد. لطفاً ابتدا ثبت‌نام کنید."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete any existing unused reset codes for this phone
            VerificationCode.objects.filter(phone_number=phone_number, type=VerificationCode.PHONE).delete()
            
            # Create verification code
            verification_code = VerificationCode.create_for_phone(phone_number)
            
            # Send SMS with reset password template
            sms_sent = send_reset_password_sms(phone_number, verification_code.code)
            print("\n\n",20*"-", "reset password sms_sent:", sms_sent)

            if sms_sent:
                return Response({
                    "message": "کد تایید ریست رمز عبور به شماره موبایل شما ارسال شد",
                    "phone_number": phone_number
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyResetPasswordCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Verify reset password code
        """
        serializer = VerifyResetPasswordCodeSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            code = serializer.validated_data['code']
            
            # Find the verification code
            try:
                verification_code = VerificationCode.objects.get(
                    phone_number=phone_number,
                    code=code,
                    type=VerificationCode.PHONE,
                    is_used=False
                )
                
                if verification_code.is_valid():
                    verification_code.is_used = True
                    verification_code.save()
                    
                    return Response({
                        "message": "کد تایید صحیح است. اکنون می‌توانید رمز عبور جدید خود را تنظیم کنید.",
                        "phone_number": phone_number
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {"error": "کد تایید منقضی شده است"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except VerificationCode.DoesNotExist:
                return Response(
                    {"error": "کد تایید نامعتبر است"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Reset password with verified code
        """
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            code = serializer.validated_data['code']
            new_password = serializer.validated_data['new_password']
            
            # Verify the code is valid and recent
            try:
                verification_code = VerificationCode.objects.get(
                    phone_number=phone_number,
                    code=code,
                    type=VerificationCode.PHONE,
                    is_used=True
                )
                
                # Check if code was used recently (within last 10 minutes)
                from django.utils import timezone
                from datetime import timedelta
                time_threshold = timezone.now() - timedelta(minutes=10)
                
                if verification_code.created_at < time_threshold:
                    return Response(
                        {"error": "کد تایید منقضی شده است. لطفاً دوباره درخواست کد دهید."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get user profile and update password
                try:
                    user_profile = UserProfile.objects.get(phone_number=phone_number)
                    user = user_profile.user
                    user.set_password(new_password)
                    user.save()
                    
                    return Response({
                        "message": "رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید."
                    }, status=status.HTTP_200_OK)
                    
                except UserProfile.DoesNotExist:
                    return Response(
                        {"error": "کاربر یافت نشد"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except VerificationCode.DoesNotExist:
                return Response(
                    {"error": "کد تایید نامعتبر است"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

