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
