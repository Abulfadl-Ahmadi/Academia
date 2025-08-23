from rest_framework import serializers

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

    class Meta:
        model = Test
        fields = ['name', 'description', 'test_collection', 'pdf_file', 'start_time', 'end_time', 'duration', 'frequency', 'keys']

    def update(self, instance, validated_data):
        keys_data = validated_data.pop('keys', None)

        # ابتدا خود آزمون رو آپدیت کن
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if keys_data is not None:

            # کلیدهای جدید رو ذخیره کن
            for key in keys_data:
                PrimaryKey.objects.update_or_create(test=instance, question_number=key["question_number"],defaults={"answer": key["answer"]}
                )

        return instance

class TestDetailSerializer(serializers.ModelSerializer):
    pdf_file_url = serializers.SerializerMethodField()
    answers_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = ["id", 'name', 'description', 'test_collection', 'pdf_file', 'answers_file', 
                 'pdf_file_url', 'answers_file_url', 'start_time', 'end_time', 'duration', 'frequency']
        read_only_fields = ['teacher']

    def get_pdf_file_url(self, obj):
        request = self.context.get('request')
        if obj.pdf_file and obj.pdf_file.file:
            return request.build_absolute_uri(obj.pdf_file.file.url) if request else obj.pdf_file.file.url
        return None
        
    def get_answers_file_url(self, obj):
        request = self.context.get('request')
        if obj.answers_file and obj.answers_file.file:
            return request.build_absolute_uri(obj.answers_file.file.url) if request else obj.answers_file.file.url
        return None


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

