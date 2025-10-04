from rest_framework import serializers
from .models import Course, CourseSession, CourseSchedule, ClassCategory
from accounts.models import User
from contents.serializers import FileSerializer as ContentsFileSerializer
from tests.models import Test


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


"""We reuse the FileSerializer from contents app to ensure a single source of truth."""


class CourseScheduleSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source='get_day_display', read_only=True)
    
    class Meta:
        model = CourseSchedule
        fields = ['id', 'course', 'day', 'day_display', 'time']


class CourseSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    students_count = serializers.IntegerField(read_only=True)
    sessions_count = serializers.IntegerField(read_only=True)
    tests_count = serializers.IntegerField(read_only=True)
    students = UserSerializer(read_only=True, many=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'teacher', 'students',
            'vod_channel_id', 'created_at', 'updated_at', 'is_active',
            'students_count', 'sessions_count', 'tests_count'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        # اگر کاربر لاگین هست و غیر از دانش‌آموز است، فیلدهای RTMP و live status را اضافه کن
        if request and request.user.is_authenticated and request.user.role != 'student':
            representation['rtmp_url'] = instance.rtmp_url
            representation['rtmp_key'] = instance.rtmp_key
            representation['live_iframe'] = instance.live_iframe
            representation['is_live'] = instance.is_live
        # برای دانش‌آموزان فقط iframe در صورت live بودن
        elif request and request.user.is_authenticated and request.user.role == 'student':
            representation['is_live'] = instance.is_live
            if instance.is_live and instance.live_iframe:
                representation['live_iframe'] = instance.live_iframe
            
        return representation


class TeacherCourseSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    students_count = serializers.IntegerField(read_only=True)
    sessions_count = serializers.IntegerField(read_only=True)
    tests_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'teacher', 'students_count', 'vod_channel_id',
            'sessions_count', 'tests_count', 'created_at', 'updated_at', 'is_active',
            'rtmp_url', 'rtmp_key', 'live_iframe', 'is_live', 'chat_mode'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ClassCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassCategory
        fields = "__all__"


class StudentCourseSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    students_count = serializers.IntegerField(read_only=True)
    sessions_count = serializers.SerializerMethodField(read_only=True)
    tests_count = serializers.SerializerMethodField(read_only=True)
    last_accessed = serializers.DateTimeField(read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'teacher', 'students_count',
            'sessions_count', 'tests_count', 'last_accessed', 'progress_percentage'
        ]

    def get_sessions_count(self, obj):
        print(obj)
        return obj.sessions.filter(is_published=True).count()

    def get_tests_count(self, obj):
        # شمارش تست‌ها از طریق test_collections
        total_tests = 0
        for test_collection in obj.test_collections.all():
            total_tests += test_collection.tests.count()
        return total_tests

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        representation['is_live'] = instance.is_live
        representation['chat_mode'] = instance.chat_mode
        if instance.is_live and instance.live_iframe:
            representation['live_iframe'] = instance.live_iframe
            
        return representation


class CourseSessionSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())

    class Meta:
        model = CourseSession
        fields = [
            'id', 'course', 'title', 'session_number', 'description',
            'created_at', 'updated_at', 'is_published'
        ]
        read_only_fields = ['created_at', 'updated_at']


class StudentSessionSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(read_only=True)
    is_watched = serializers.BooleanField(read_only=True)
    files = serializers.SerializerMethodField()

    class Meta:
        model = CourseSession
        fields = [
            'id', 'course', 'title', 'session_number', 'description',
            'created_at', 'is_watched', 'files'
        ]
        read_only_fields = ['created_at']

    def get_files(self, obj):
        from contents.models import File
        files = File.objects.filter(session=obj)
        return ContentsFileSerializer(files, many=True, context=self.context).data


class CourseTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = ['id', 'name', 'description', 'test_collection', 'pdf_file', 'start_time', 'end_time', 'duration', 'frequency']