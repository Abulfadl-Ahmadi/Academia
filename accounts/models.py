from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import BaseUserManager
from django.core.validators import RegexValidator
from .validators import validate_iranian_national_id
import random
import string
from datetime import timedelta
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("Username is required")
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(username, password, **extra_fields)

    def get_by_natural_key(self, username):
        return self.get(username=username)
    
    def students(self):
        return self.filter(role='student')

    def teachers(self):
        return self.filter(role='teacher')
    
class User(AbstractUser):
    STUDENT = 'student'
    TEACHER = 'teacher'
    ADMIN = 'admin'

    ROLE_CHOICES = (
        (STUDENT, 'Student'),
        (TEACHER, 'Teacher'),
        (ADMIN, 'Admin'),
    )
    email = models.EmailField(blank=True, null=True, unique=False)  # make email optional
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=STUDENT)
    is_email_verified = models.BooleanField(default=False)

    objects = UserManager()

    def __str__(self):
        return self.username


class VerificationCode(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.email} - {self.code}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        return not self.is_used and not self.is_expired()
    
    @classmethod
    def generate_code(cls):
        """Generate a random 6-digit code"""
        return ''.join(random.choices(string.digits, k=6))
    
    @classmethod
    def create_for_email(cls, email):
        """Create a new verification code for an email"""
        # Delete any existing unused codes for this email
        cls.objects.filter(email=email, is_used=False).delete()
        
        # Create new code
        code = cls.generate_code()
        expires_at = timezone.now() + timedelta(minutes=10)  # 10 minutes expiry
        
        return cls.objects.create(
            email=email,
            code=code,
            expires_at=expires_at
        )


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    national_id = models.CharField(
        max_length=10,
        validators=[validate_iranian_national_id],
        blank=True,
        null=True
    )
    phone_number = models.CharField(
        max_length=11,
        validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')],
        blank=True,
        null=True
    )
    birth_date = models.DateField(blank=True, null=True)
    grade = models.CharField(
        max_length=2,
        choices=[('10', '10'), ('11', '11'), ('12', '12')],
        blank=True,
        null=True
    )  # only used if role == 'student'

    def __str__(self):
        return f"{self.user.username} ({self.user.role})"
    




