from django.db import models
from accounts.models import User


class Course(models.Model):
    title = models.CharField(max_length=255)
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
    session_number = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.course.title} - Session {self.session_number}"
