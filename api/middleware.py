from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

class RefreshTokenMiddleware(MiddlewareMixin):
    def process_request(self, request):
        access_token = request.COOKIES.get("access")
        refresh_token = request.COOKIES.get("refresh")

        if not access_token:
            return None  # No token, let view handle it

        try:
            AccessToken(access_token)  # Try to validate
        except TokenError:
            if refresh_token:
                try:
                    new_access = RefreshToken(refresh_token).access_token
                    request._new_access_token = str(new_access)
                except TokenError:
                    return JsonResponse({"detail": "Login expired"}, status=401)

        return None

    def process_response(self, request, response):
        if hasattr(request, "_new_access_token"):
            response.set_cookie(
                key="access",
                value=request._new_access_token,
                httponly=True,
                samesite="Lax",
                secure=False,
            )
        return response
