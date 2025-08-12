from django.db import models
from contents.models import File
from accounts.models import User
from courses.models import Course
from django.utils import timezone
from datetime import timedelta


class Test(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='tests', null=True, blank=True)
    pdf_file = models.ForeignKey(File, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.DurationField()
    frequency = models.CharField(max_length=100)  # e.g. 'once', 'weekly', etc.

class PrimaryKey(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='keys')
    question_number = models.IntegerField()
    answer = models.IntegerField()



class StudentTestSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    device_id = models.CharField(max_length=200, null=True, blank=True)

    entry_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField()
    exit_time = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'test'],
                condition=models.Q(status='active'),
                name='unique_active_session_per_test'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'test']),
            models.Index(fields=['status']),
        ]

    def save(self, *args, **kwargs):
        if not self.entry_time:
            self.entry_time = timezone.now()
        if not self.end_time:
            self.end_time = self.entry_time + self.test.duration
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() >= self.end_time

class StudentTestSessionLog(models.Model):
    session = models.ForeignKey(StudentTestSession, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=[('login', 'Login'), ('logout', 'Logout')])
    timestamp = models.DateTimeField(auto_now_add=True)
    device_id = models.CharField(max_length=255, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)


class StudentAnswer(models.Model):
    session = models.ForeignKey(StudentTestSession, on_delete=models.CASCADE, related_name='answers')
    question_number = models.IntegerField()
    answer = models.IntegerField()
