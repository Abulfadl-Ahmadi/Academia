from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("access")
        
        # if settings.DEBUG:
        #     print(f"[DEBUG] All cookies: {request.COOKIES}")
        #     print(f"[DEBUG] Access token from cookie: {raw_token}")
        
        if raw_token is None:
            return None
            
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            # if settings.DEBUG:
                # print(f"[DEBUG] Authenticated user: {user}")
            return user, validated_token
        except Exception as e:
            # if settings.DEBUG:
                # print(f"[DEBUG] Token validation failed: {e}")
            return None
