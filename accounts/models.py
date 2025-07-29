from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from .validators import validate_iranian_national_id


class UserManager(models.Manager):
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
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    objects = UserManager()

    def __str__(self):
        return self.username

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
    




