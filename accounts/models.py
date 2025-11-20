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
        
        # ایجاد دسترسی AI برای کاربر جدید
        AIAccess.objects.create(user=user)
        
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
    EMAIL = 'email'
    PHONE = 'phone'
    TYPE_CHOICES = (
        (EMAIL, 'Email'),
        (PHONE, 'Phone'),
    )
    
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=11, blank=True, null=True, validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')])
    code = models.CharField(max_length=6)
    type = models.CharField(max_length=5, choices=TYPE_CHOICES, default=EMAIL)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        target = self.email if self.type == self.EMAIL else self.phone_number
        return f"{target} - {self.code}"
    
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
            expires_at=expires_at,
            type=cls.EMAIL
        )
    
    @classmethod
    def create_for_phone(cls, phone_number):
        """Create a new verification code for a phone number"""
        # Delete any existing unused codes for this phone
        cls.objects.filter(phone_number=phone_number, is_used=False).delete()
        
        # Create new code
        code = cls.generate_code()
        expires_at = timezone.now() + timedelta(minutes=10)  # 10 minutes expiry
        
        return cls.objects.create(
            phone_number=phone_number,
            code=code,
            expires_at=expires_at,
            type=cls.PHONE
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
    school = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="مرکز آموزشی"
    )
    grade = models.CharField(
        max_length=2,
        choices=[('10', '10'), ('11', '11'), ('12', '12')],
        blank=True,
        null=True
    )  # only used if role == 'student'

    def __str__(self):
        return f"{self.user.username} ({self.user.role})"


class UserAddress(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='address')
    full_name = models.CharField(max_length=200, verbose_name="نام کامل")
    phone_number = models.CharField(
        max_length=11, 
        validators=[RegexValidator(regex=r'^09\d{9}$', message='شماره موبایل نامعتبر است')],
        verbose_name="شماره موبایل"
    )
    province = models.CharField(max_length=100, verbose_name="استان")
    city = models.CharField(max_length=100, verbose_name="شهر")
    postal_code = models.CharField(
        max_length=10, 
        validators=[RegexValidator(regex=r'^\d{10}$', message='کد پستی باید 10 رقم باشد')],
        verbose_name="کد پستی"
    )
    address_line = models.TextField(verbose_name="آدرس کامل")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "آدرس کاربر"
        verbose_name_plural = "آدرس‌های کاربران"
    
    def __str__(self):
        return f"{self.user.username} - {self.city}, {self.province}"
    
    @property
    def is_complete(self):
        """Check if all required address fields are filled"""
        required_fields = [
            self.full_name, self.phone_number, self.province, 
            self.city, self.postal_code, self.address_line
        ]
        return all(field and field.strip() for field in required_fields)
    
    @property
    def formatted_address(self):
        """Return formatted address for display"""
        return f"{self.address_line}, {self.city}, {self.province} - {self.postal_code}"


class AIAccess(models.Model):
    """مدل دسترسی به هوش مصنوعی برای هر کاربر"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_access', verbose_name='کاربر')
    questions_limit = models.PositiveIntegerField(default=50, verbose_name='محدودیت تعداد سوالات')
    access_duration = models.DateTimeField(default=timezone.now() + timedelta(days=365), verbose_name='مدت زمان دسترسی')
    model = models.CharField(max_length=50, default='gemini', verbose_name='مدل زبانی')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')
    
    class Meta:
        verbose_name = 'دسترسی هوش مصنوعی'
        verbose_name_plural = 'دسترسی‌های هوش مصنوعی'
    
    def __str__(self):
        return f'دسترسی AI برای {self.user.username}'
    
    @property
    def is_active(self):
        """چک کردن فعال بودن دسترسی"""
        return timezone.now() <= self.access_duration
    
    def get_remaining_questions(self):
        """محاسبه تعداد سوالات باقی مانده"""
        from tickets.models import AIMessage
        used_questions = AIMessage.objects.filter(conversation__user=self.user).count()
        return max(0, self.questions_limit - used_questions)
    




