from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework import viewsets, permissions
from .models import UserProfile
from .serializers import UserProfileSerializer

class UserProfileViewSet(viewsets.ModelViewSet):
    '''
Example POST JSON body:
{
  "user": {
    "username": "sara2025",
    "email": "sara@example.com",
    "password": "safePass123",
    "first_name": "Sara",
    "last_name": "Amiri",
    "role": "student"
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
                secure=True,       # Set to True in production (HTTPS)
                samesite="Lax"
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite="Lax"
            )

            return response
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

