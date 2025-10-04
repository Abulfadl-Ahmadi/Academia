from django.db import models
from accounts.models import User
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class ClassCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name
    
    
class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(ClassCategory, on_delete=models.SET_NULL, null=True, blank=True)
    students = models.ManyToManyField(
        User,
        related_name="enrolled_courses",
        limit_choices_to={"role": "student"},
        blank=True,
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="taught_courses",
        null=True,
        blank=True,
        limit_choices_to={"role": "teacher"},
    )
    vod_channel_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    rtmp_url = models.CharField(max_length=255,blank=True, null=True, default=None)
    rtmp_key = models.CharField(max_length=255, blank=True, null=True, default=None)
    live_iframe = models.TextField(blank=True, null=True, help_text="کد iframe برای نمایش پخش زنده")
    is_live = models.BooleanField(default=False)
    chat_mode = models.CharField(
        max_length=20, 
        choices=[
            ('public', 'عمومی - همه پیام‌ها قابل مشاهده'),
            ('private', 'خصوصی - فقط پیام معلم قابل مشاهده')
        ],
        default='public',
        help_text="حالت نمایش چت برای دانش‌آموزان"
    )

    def __str__(self):
        return self.title


class CourseSchedule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="schedules")
    DAYS = (
        (0, "Saturday"),
        (1, "Sunday"),
        (2, "Monday"),
        (3, "Tuesday"),
        (4, "Wednesday"),
        (5, "Thursday"),
        (6, "Friday"),
    )
    day = models.IntegerField(choices=DAYS)
    time = models.TimeField()

    def __str__(self):
        return f"{self.course.title} - {self.get_day_display()} at {self.time}"


class CourseSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="sessions")
    title = models.CharField(max_length=255)
    session_number = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ['session_number']
        # unique_together = ['course'] # TODE: add session_number

    def __str__(self):
        return f"{self.course.title} - Session {self.session_number}: {self.title}"
