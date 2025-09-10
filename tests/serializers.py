from rest_framework import serializers
from datetime import timedelta

from contents.models import File
from .models import (
    Test, PrimaryKey, StudentTestSession, StudentAnswer,
    TestCollection, StudentProgress
)
from courses.models import Course
from accounts.models import User


class PrimaryKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrimaryKey
        fields = ['question_number', 'answer']

class CourseNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title"]

class TestCreateSerializer(serializers.ModelSerializer):
    keys = PrimaryKeySerializer(many=True, required=False)
    pdf_file = serializers.PrimaryKeyRelatedField(queryset=File.objects.filter(content_type=File.ContentType.TEST))
    answers_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST),
        required=False,
        allow_null=True
    )
    status = serializers.SerializerMethodField()
    test_collection = serializers.PrimaryKeyRelatedField(
        queryset=TestCollection.objects.all(),
        required=True
    )

    test_collection_detail = serializers.SerializerMethodField()
    course_detail = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id", 'name', 'status', 'test_collection_detail', 'course_detail',
            'description', 'test_collection', 'pdf_file', 'answers_file',
            'start_time', 'end_time', 'duration', 'frequency', 'keys'
        ]
        read_only_fields = ['teacher']

    def get_test_collection_detail(self, obj):
        if obj.test_collection:
            return {
                'id': obj.test_collection.id,
                'name': obj.test_collection.name
            }
        return None

    def get_course_detail(self, obj):
        # Get course information through test_collection
        if obj.test_collection and obj.test_collection.courses.exists():
            # Return the first course (or you can modify this logic as needed)
            course = obj.test_collection.courses.first()
            return {
                'id': course.id,
                'title': course.title
            }
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        keys_data = validated_data.pop('keys', None)
        
        # تبدیل duration از دقیقه به timedelta
        if 'duration' in validated_data:
            duration_minutes = validated_data['duration']
            if isinstance(duration_minutes, (int, float)):
                validated_data['duration'] = timedelta(minutes=duration_minutes)
        
        test = Test.objects.create(teacher=user, **validated_data)

        for key in keys_data:
            PrimaryKey.objects.create(test=test, **key)
        return test

    def get_status(self, obj):
        request = self.context.get('request')
        user = request.user
        sessions = StudentTestSession.objects.filter(user=user, test=obj.id).order_by("-id")
        if len(sessions) == 0:
            return ""
        else:
            return sessions.first().status


class TestUpdateSerializer(serializers.ModelSerializer):
    keys = PrimaryKeySerializer(many=True, required=False)
    pdf_file = serializers.PrimaryKeyRelatedField(queryset=File.objects.filter(content_type=File.ContentType.TEST))
    answers_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Test
        fields = ['name', 'description', 'test_collection', 'pdf_file', 'answers_file', 'start_time', 'end_time', 'duration', 'frequency', 'keys']

    def update(self, instance, validated_data):
        keys_data = validated_data.pop('keys', None)

        # تبدیل duration از string به timedelta
        if 'duration' in validated_data:
            duration_str = validated_data['duration']
            if isinstance(duration_str, str):
                # فرمت: "HH:MM:SS"
                parts = duration_str.split(':')
                hours = int(parts[0])
                minutes = int(parts[1])
                seconds = int(parts[2]) if len(parts) > 2 else 0
                validated_data['duration'] = timedelta(hours=hours, minutes=minutes, seconds=seconds)

        # ابتدا خود آزمون رو آپدیت کن
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if keys_data is not None:
            # حذف کلیدهای قبلی
            PrimaryKey.objects.filter(test=instance).delete()

            # کلیدهای جدید رو ذخیره کن
            for key in keys_data:
                PrimaryKey.objects.update_or_create(
                    test=instance, 
                    question_number=key["question_number"],
                    defaults={"answer": key["answer"]}
                )

        return instance

class TestDetailSerializer(serializers.ModelSerializer):
    pdf_file_url = serializers.SerializerMethodField()
    answers_file_url = serializers.SerializerMethodField()
    collection = serializers.SerializerMethodField()
    questions_count = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    time_limit = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    keys = serializers.SerializerMethodField()  # فقط برای معلم
    pdf_file = serializers.SerializerMethodField()  # فقط ID برای معلم
    answers_file = serializers.SerializerMethodField()  # فقط ID برای معلم
    
    class Meta:
        model = Test
        fields = ["id", 'name', 'description', 'test_collection', 'pdf_file', 'answers_file', 
                 'pdf_file_url', 'answers_file_url', 'start_time', 'end_time', 'duration', 'duration_formatted', 'frequency',
                 'collection', 'questions_count', 'total_questions', 'time_limit', 'is_active', 'created_at', 'keys']
        read_only_fields = ['teacher']

    def get_pdf_file(self, obj):
        """فقط معلم‌ها می‌توانند ID فایل PDF را ببینند"""
        request = self.context.get('request')
        if request and request.user.role == 'teacher':
            return obj.pdf_file.id if obj.pdf_file else None
        return None

    def get_answers_file(self, obj):
        """فقط معلم‌ها می‌توانند ID فایل پاسخنامه را ببینند"""
        request = self.context.get('request')
        if request and request.user.role == 'teacher':
            return obj.answers_file.id if obj.answers_file else None
        return None

    def get_keys(self, obj):
        """فقط معلم‌ها می‌توانند پاسخ‌های صحیح را ببینند"""
        request = self.context.get('request')
        if request and request.user.role == 'teacher':
            keys_data = []
            for key in obj.primary_keys.all():
                keys_data.append({
                    'question_number': key.question_number,
                    'answer': key.answer
                })
            return keys_data
        return []  # برای دانش‌آموزان آرایه خالی برمی‌گردانیم

    def get_pdf_file_url(self, obj):
        request = self.context.get('request')
        if request:
            # همیشه URL امن را برمی‌گردانیم، کنترل دسترسی در SecureTestFileView انجام می‌شود
            from django.urls import reverse
            return request.build_absolute_uri(
                reverse('secure-test-file', kwargs={'test_id': obj.id, 'file_type': 'pdf'})
            )
        return None
        
    def get_answers_file_url(self, obj):
        """فقط معلم‌ها می‌توانند فایل پاسخنامه را ببینند"""
        request = self.context.get('request')
        if request and request.user.role == 'teacher' and obj.answers_file:
            # همیشه URL امن را برمی‌گردانیم، کنترل دسترسی در SecureTestFileView انجام می‌شود
            from django.urls import reverse
            return request.build_absolute_uri(
                reverse('secure-test-file', kwargs={'test_id': obj.id, 'file_type': 'answers'})
            )
        return None  # دانش‌آموزان نمی‌توانند فایل پاسخنامه را ببینند

    def get_collection(self, obj):
        if obj.test_collection:
            return {
                'id': obj.test_collection.id,
                'name': obj.test_collection.name,
                'created_by_name': f"{obj.test_collection.created_by.first_name} {obj.test_collection.created_by.last_name}".strip() or obj.test_collection.created_by.username
            }
        return None

    def get_questions_count(self, obj):
        # برای حالا یک عدد ثابت برمی‌گردانیم، بعداً می‌توان از PDF استخراج کرد
        return 20

    def get_total_questions(self, obj):
        """محاسبه تعداد کل سوالات"""
        return obj.get_total_questions()

    def get_time_limit(self, obj):
        # زمان آزمون را بر حسب دقیقه برمی‌گردانیم
        if obj.duration:
            return int(obj.duration.total_seconds() // 60)
        return 60  # پیش‌فرض 60 دقیقه

    def get_duration_formatted(self, obj):
        # زمان آزمون را به صورت ساعت:دقیقه برمی‌گردانیم
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours:02d}:{minutes:02d}"
        return "01:00"  # پیش‌فرض 1 ساعت


class TestCollectionSerializer(serializers.ModelSerializer):
    """سریالایزر برای مجموعه آزمون"""
    tests_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    courses_info = CourseNestedSerializer(source='courses', many=True, read_only=True)
    
    class Meta:
        model = TestCollection
        fields = [
            'id', 'name', 'description', 'is_active',
            'tests_count', 'students_count', 'courses_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_tests_count(self, obj):
        return obj.get_total_tests()

    def get_students_count(self, obj):
        return obj.get_accessible_students().count()


class TestCollectionDetailSerializer(serializers.ModelSerializer):
    """سریالایزر تفصیلی برای مجموعه آزمون"""
    courses = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Course.objects.all(),
        required=False
    )
    course_details = serializers.SerializerMethodField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_tests = serializers.SerializerMethodField(read_only=True)
    student_count = serializers.SerializerMethodField(read_only=True)
    tests = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = TestCollection
        fields = [
            'id', 'name', 'description', 'courses', 'course_details',
            'created_by', 'created_by_name', 'total_tests', 'student_count',
            'tests', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_course_details(self, obj):
        """جزئیات کلاس‌های مرتبط"""
        return [{'id': course.id, 'title': course.title} for course in obj.courses.all()]

    def get_total_tests(self, obj):
        """تعداد کل آزمون‌های این مجموعه"""
        return obj.tests.count()

    def get_student_count(self, obj):
        """تعداد دانش‌آموزان دارای دسترسی"""
        return len(obj.get_accessible_students())

    def get_tests(self, obj):
        """لیست آزمون‌های این مجموعه"""
        tests = obj.tests.all().order_by('-created_at')
        request = self.context.get('request')
        user = request.user if request else None
        
        result = []
        for test in tests:
            test_data = {
                'id': test.id,
                'name': test.name,
                'description': test.description,
                'questions_count': test.primary_keys.count(),  # Count questions based on primary keys
                'time_limit': int(test.duration.total_seconds() / 60) if test.duration else 0,
                'is_active': test.is_active,  
                'created_at': test.created_at.isoformat(),
                'start_time': test.start_time.isoformat() if test.start_time else None,
                'end_time': test.end_time.isoformat() if test.end_time else None,
                'pdf_file_url': test.pdf_file.file.url if test.pdf_file and test.pdf_file.file else None,
                'answers_file_url': test.answers_file.file.url if test.answers_file and test.answers_file.file else None,
            }
            
            # Add test status for the current user
            if user and user.role == 'student':
                sessions = test.studenttestsession_set.filter(user=user).order_by('-id')
                if sessions.exists():
                    test_data['status'] = sessions.first().status
            
            result.append(test_data)
            
        return result


class TestCollectionSerializer(serializers.ModelSerializer):
    """سریالایزر برای مجموعه آزمون"""
    courses = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Course.objects.all(),
        required=False
    )
    course_details = serializers.SerializerMethodField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_tests = serializers.SerializerMethodField(read_only=True)
    student_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = TestCollection
        fields = [
            'id', 'name', 'description', 'courses', 'course_details',
            'created_by', 'created_by_name', 'total_tests', 'student_count',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_course_details(self, obj):
        """جزئیات کلاس‌های مرتبط"""
        return [{'id': course.id, 'title': course.title} for course in obj.courses.all()]

    def get_total_tests(self, obj):
        """تعداد کل آزمون‌های این مجموعه"""
        return obj.tests.count()

    def get_student_count(self, obj):
        """تعداد دانش‌آموزان دارای دسترسی"""
        return len(obj.get_accessible_students())


class StudentProgressSerializer(serializers.ModelSerializer):
    """سریالایزر برای پیشرفت دانش‌آموز"""
    test_collection_name = serializers.CharField(source='test_collection.name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    average_score = serializers.ReadOnlyField()
    
    class Meta:
        model = StudentProgress
        fields = [
            'id', 'test_collection', 'test_collection_name', 'student', 'student_name',
            'completed_tests', 'total_score', 'progress_percentage', 'average_score',
            'started_at', 'last_activity', 'is_completed'
        ]
        read_only_fields = ['started_at', 'last_activity']


class TopicTestCreateSerializer(serializers.ModelSerializer):
    """سریالایزر برای ایجاد آزمون مبحثی"""
    keys = PrimaryKeySerializer(many=True, required=False)
    pdf_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST)
    )
    answers_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Test
        fields = [
            'id', 'name', 'description', 'topic', 'pdf_file', 'answers_file',
            'duration', 'keys', 'is_active'
        ]
        read_only_fields = ['teacher', 'test_type']
    
    def create(self, validated_data):
        keys_data = validated_data.pop('keys', [])
        validated_data['test_type'] = 'topic_based'  # Use string instead of TestType enum
        validated_data['teacher'] = self.context['request'].user
        
        test = Test.objects.create(**validated_data)
        
        # ایجاد کلیدها
        for key_data in keys_data:
            PrimaryKey.objects.create(test=test, **key_data)
        
        return test


class TopicTestDetailSerializer(serializers.ModelSerializer):
    """سریالایزر تفصیلی آزمون مبحثی"""
    keys = PrimaryKeySerializer(source='primary_keys', many=True, read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    topic_detail = serializers.SerializerMethodField()
    display_status = serializers.ReadOnlyField(source='get_display_status')
    can_take_now = serializers.SerializerMethodField()
    total_questions = serializers.ReadOnlyField(source='get_total_questions')
    participants_count = serializers.ReadOnlyField(source='get_participants_count')
    
    class Meta:
        model = Test
        fields = [
            'id', 'name', 'description', 'test_type', 'topic', 'topic_name',
            'topic_detail', 'pdf_file', 'answers_file', 'duration',
            'display_status', 'can_take_now', 'total_questions',
            'participants_count', 'is_active', 'created_at', 'keys'
        ]
    
    def get_topic_detail(self, obj):
        if obj.topic:
            return {
                'id': obj.topic.id,
                'name': obj.topic.name,
                'section': obj.topic.section.name,
                'chapter': obj.topic.section.chapter.name,
                'subject': obj.topic.section.chapter.subject.name,
                'difficulty': obj.topic.difficulty
            }
        return None
    
    def get_can_take_now(self, obj):
        return obj.can_student_take_now()


class StartTopicTestSerializer(serializers.Serializer):
    """سریالایزر برای شروع آزمون مبحثی"""
    test_id = serializers.IntegerField()
    device_id = serializers.CharField(max_length=200, required=False)

