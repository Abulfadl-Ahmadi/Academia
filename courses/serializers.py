from rest_framework import serializers
from .models import Course, CourseSchedule, CourseSession
from accounts.models import User


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "role"]


class CourseScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSchedule
        fields = ["id", "day", "time"]


class CourseSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSession
        fields = ["id", "session_number"]


class CourseSerializer(serializers.ModelSerializer):
    students = UserBriefSerializer(many=True, read_only=True)
    teacher = UserBriefSerializer(read_only=True)
    schedules = CourseScheduleSerializer(many=True, read_only=True)
    sessions = CourseSessionSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "vod_channel_id", "teacher", "students", "schedules", "sessions"]
