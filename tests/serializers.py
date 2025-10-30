from rest_framework import serializers
from datetime import timedelta
from django.utils.dateparse import parse_duration
import base64
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models
from io import BytesIO
from PIL import Image

from contents.models import File
from .models import (
    Test, PrimaryKey, StudentTestSession, StudentAnswer,
    TestCollection, StudentProgress, Question, Option, QuestionImage, DetailedSolutionImage,
    QuestionCollection, TestType, TestContentType
)
from courses.models import Course
from accounts.models import User
from knowledge.models import Folder


class Base64ImageField(serializers.ImageField):
    """
    A Django REST framework field for handling base64 encoded images, including SVG.
    """
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            # Handle base64 encoded image
            try:
                # Extract the base64 part
                header, base64_data = data.split(',', 1)
                # Get the format from the header
                content_type = header.split(';')[0]  # e.g., "data:image/svg+xml"
                format_part = content_type.split('/')[1]  # e.g., "svg+xml"

                # Check if it's SVG (could be svg or svg+xml)
                is_svg = 'svg' in format_part.lower()

                # Decode base64
                image_data = base64.b64decode(base64_data)

                # Create ContentFile with proper positioning
                # Clean up format_part for filename (svg+xml -> svg)
                clean_format = format_part.split('+')[0] if '+' in format_part else format_part
                file_name = f"upload.{clean_format}"
                file_obj = ContentFile(image_data, name=file_name)

                # Ensure file pointer is at the beginning
                file_obj.seek(0)

                # For SVG files, bypass PIL validation since PIL doesn't support SVG
                if is_svg:
                    # Create a SimpleUploadedFile for SVG
                    svg_file = SimpleUploadedFile(
                        name=file_name,
                        content=image_data,
                        content_type=content_type
                    )
                    return svg_file
                else:
                    # Use normal ImageField validation for other formats
                    return super().to_internal_value(file_obj)
            except (ValueError, IndexError) as e:
                raise serializers.ValidationError(f"Invalid base64 image data: {str(e)}")
        else:
            # Handle regular file upload or existing data
            return super().to_internal_value(data)
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
    pdf_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST),
        required=False,
        allow_null=True
    )
    answers_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST),
        required=False,
        allow_null=True
    )
    folders = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        many=True,
        required=False
    )
    questions = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(),
        many=True,
        required=False
    )
    test_collection = serializers.PrimaryKeyRelatedField(
        queryset=TestCollection.objects.all(),
        required=False,
        allow_null=True
    )
    test_type = serializers.ChoiceField(choices=TestType.choices, required=False)
    content_type = serializers.ChoiceField(choices=TestContentType.choices, required=False)
    is_active = serializers.BooleanField(required=False, default=True)
    status = serializers.SerializerMethodField()
    test_collection_detail = serializers.SerializerMethodField()
    course_detail = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id", 'name', 'description', 'test_type', 'content_type', 'is_active',
            'status', 'test_collection', 'test_collection_detail', 'course_detail',
            'pdf_file', 'answers_file', 'start_time', 'end_time', 'duration',
            'frequency', 'folders', 'questions', 'keys'
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
        if obj.test_collection and obj.test_collection.courses.exists():
            course = obj.test_collection.courses.first()
            return {
                'id': course.id,
                'title': course.title
            }
        return None

    def _parse_duration(self, value):
        if value is None or value == "":
            return timedelta(minutes=60)
        if isinstance(value, timedelta):
            return value
        if isinstance(value, (int, float)):
            return timedelta(minutes=float(value))
        if isinstance(value, str):
            parsed = parse_duration(value)
            if parsed is not None:
                return parsed
            raise serializers.ValidationError({'duration': 'فرمت مدت زمان نامعتبر است'})
        raise serializers.ValidationError({'duration': 'فرمت مدت زمان نامعتبر است'})

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        keys_data = validated_data.pop('keys', [])
        folders = validated_data.pop('folders', [])
        questions = validated_data.pop('questions', [])

        test_type = validated_data.get('test_type') or TestType.SCHEDULED
        content_type = validated_data.get('content_type') or TestContentType.PDF
        validated_data['test_type'] = test_type
        validated_data['content_type'] = content_type
        validated_data['is_active'] = validated_data.get('is_active', True)

        # Normalize duration
        validated_data['duration'] = self._parse_duration(validated_data.get('duration'))

        # Validate scheduling requirements
        if test_type == TestType.SCHEDULED:
            if not validated_data.get('start_time') or not validated_data.get('end_time'):
                raise serializers.ValidationError({
                    'start_time': 'برای آزمون زمان‌بندی شده تعیین زمان شروع و پایان الزامی است'
                })
        else:
            # در صورت عدم نیاز، مقادیر خالی را ذخیره نکنیم
            validated_data['start_time'] = validated_data.get('start_time')
            validated_data['end_time'] = validated_data.get('end_time')

        # Validate content-specific requirements
        if content_type == TestContentType.PDF:
            if not validated_data.get('pdf_file'):
                raise serializers.ValidationError({
                    'pdf_file': 'برای آزمون PDF انتخاب فایل آزمون الزامی است'
                })
            # اجازه می‌دهیم questions خالی باشد
            questions = []
        else:
            validated_data['pdf_file'] = None
            validated_data['answers_file'] = validated_data.get('answers_file') or None
            if not questions:
                raise serializers.ValidationError({
                    'questions': 'برای آزمون سوالی انتخاب سوال الزامی است'
                })

        validated_data['teacher'] = user

        test_instance = Test(**validated_data)

        if (
            test_type == TestType.TOPIC_BASED
            and not getattr(test_instance, "topic", None)
            and not getattr(test_instance, "knowledge_path", None)
            and folders
        ):
            # Allow model.clean to pass when we only have folders for a topic based test
            setattr(test_instance, "_pending_folders", list(folders))

        test_instance.save()
        test = test_instance

        if folders:
            test.folders.set(folders)
        if questions:
            test.questions.set(questions)

        if keys_data and content_type == TestContentType.PDF:
            for key in keys_data:
                PrimaryKey.objects.create(
                    test=test,
                    question_number=int(key['question_number']),
                    answer=int(key['answer'])
                )
        return test

    def get_status(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return ""
        sessions = StudentTestSession.objects.filter(user=user, test=obj.id).order_by("-id")
        if not sessions:
            return ""
        return sessions.first().status


class TestUpdateSerializer(serializers.ModelSerializer):
    keys = PrimaryKeySerializer(many=True, required=False)
    pdf_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST),
        required=False,
        allow_null=True
    )
    answers_file = serializers.PrimaryKeyRelatedField(
        queryset=File.objects.filter(content_type=File.ContentType.TEST),
        required=False,
        allow_null=True
    )
    questions = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(),
        many=True,
        required=False
    )
    folders = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        many=True,
        required=False
    )
    is_active = serializers.BooleanField(required=False)

    class Meta:
        model = Test
        fields = [
            'name', 'description', 'test_collection', 'pdf_file', 'answers_file',
            'start_time', 'end_time', 'duration', 'frequency', 'keys', 'questions',
            'folders', 'is_active'
        ]

    def _parse_duration(self, value):
        if value is None or value == "":
            return None
        if isinstance(value, timedelta):
            return value
        if isinstance(value, (int, float)):
            return timedelta(minutes=float(value))
        if isinstance(value, str):
            if value.startswith('PT'):
                # ISO 8601 duration
                hours = minutes = seconds = 0
                import re
                match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", value)
                if match:
                    hours = int(match.group(1) or 0)
                    minutes = int(match.group(2) or 0)
                    seconds = int(match.group(3) or 0)
                    return timedelta(hours=hours, minutes=minutes, seconds=seconds)
            parts = value.split(':')
            if len(parts) >= 2:
                hours = int(parts[0])
                minutes = int(parts[1])
                seconds = int(parts[2]) if len(parts) > 2 else 0
                return timedelta(hours=hours, minutes=minutes, seconds=seconds)
        raise serializers.ValidationError({'duration': 'فرمت مدت زمان نامعتبر است'})

    def update(self, instance, validated_data):
        keys_data = validated_data.pop('keys', None)
        questions_data = validated_data.pop('questions', None)
        folders_data = validated_data.pop('folders', None)

        if 'duration' in validated_data:
            parsed_duration = self._parse_duration(validated_data['duration'])
            if parsed_duration is not None:
                validated_data['duration'] = parsed_duration

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if folders_data is not None:
            instance.folders.set(folders_data)

        if questions_data is not None:
            instance.questions.set(questions_data)

        if keys_data is not None:
            PrimaryKey.objects.filter(test=instance).delete()
            for key in keys_data:
                PrimaryKey.objects.update_or_create(
                    test=instance,
                    question_number=key["question_number"],
                    defaults={"answer": key["answer"]}
                )

        return instance

class QuestionTestCreateSerializer(serializers.ModelSerializer):
    """سریالایزر برای ایجاد آزمون سوالی"""
    questions = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(),
        many=True,
        required=True
    )
    folders = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        many=True,
        required=True
    )

    class Meta:
        model = Test
        fields = [
            'id', 'name', 'description', 'folders', 'questions',
            'duration', 'start_time', 'end_time', 'frequency', 'is_active', 'content_type', 'test_collection'
        ]
        read_only_fields = ['teacher']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        # Extract many-to-many fields
        folders = validated_data.pop('folders', [])
        questions = validated_data.pop('questions', [])
        
        # Set the teacher
        validated_data['teacher'] = user
        validated_data['test_type'] = TestType.PRACTICE  # آزمون تمرینی
        validated_data['content_type'] = TestContentType.TYPED_QUESTION  # سوال تایپ شده
        
        # Create the test instance
        test = Test.objects.create(**validated_data)
        
        # Set many-to-many relationships
        if folders:
            test.folders.set(folders)
        if questions:
            test.questions.set(questions)
        
        return test


class QuestionTestUpdateSerializer(serializers.ModelSerializer):
    """سریالایزر برای ویرایش آزمون سوالی"""
    questions = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(),
        many=True,
        required=True
    )
    folders = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        many=True,
        required=True
    )

    class Meta:
        model = Test
        fields = [
            'id', 'name', 'description', 'folders', 'questions',
            'duration', 'start_time', 'end_time', 'frequency', 'is_active', 'content_type', 'test_collection'
        ]
        read_only_fields = ['teacher']

    def update(self, instance, validated_data):
        # Extract many-to-many fields
        folders = validated_data.pop('folders', None)
        questions = validated_data.pop('questions', None)
        
        # Update the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update many-to-many relationships
        if folders is not None:
            instance.folders.set(folders)
        if questions is not None:
            instance.questions.set(questions)
        
        return instance


class TestDetailSerializer(serializers.ModelSerializer):
    pdf_file_url = serializers.SerializerMethodField()
    answers_file_url = serializers.SerializerMethodField()
    collection = serializers.SerializerMethodField()
    questions_count = serializers.SerializerMethodField()
    folders_count = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    time_limit = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    keys = serializers.SerializerMethodField()  # فقط برای معلم
    pdf_file = serializers.SerializerMethodField()  # فقط ID برای معلم
    answers_file = serializers.SerializerMethodField()  # فقط ID برای معلم
    questions = serializers.SerializerMethodField()  # لیست سوالات آزمون
    folders = serializers.SerializerMethodField()  # لیست پوشه‌های آزمون
    
    class Meta:
        model = Test
        fields = ["id", 'name', 'description', 'test_collection', 'test_type', 'pdf_file', 'answers_file', 
                 'pdf_file_url', 'answers_file_url', 'start_time', 'end_time', 'duration', 'duration_formatted', 'frequency', 'content_type',
                 'collection', 'questions_count', 'folders_count', 'total_questions', 'time_limit', 'is_active', 'created_at', 'keys', 'questions', 'folders']
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
        """تعداد سوالات آزمون را برمی‌گرداند"""
        return obj.questions.count()

    def get_folders_count(self, obj):
        """تعداد پوشه‌های آزمون را برمی‌گرداند"""
        return obj.folders.count()

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

    def get_questions(self, obj):
        """لیست ID سوالات آزمون را برمی‌گرداند برای آزمون‌های PDF، و جزئیات کامل برای آزمون‌های سوالی در detail view"""
        if obj.content_type == TestContentType.TYPED_QUESTION:
            # برای detail view، جزئیات کامل سوالات را برمی‌گردان
            # اما برای list view، فقط IDها را برمی‌گردان تا از serialization error جلوگیری شود
            request = self.context.get('request')
            if request and request.method == 'GET' and not request.parser_context.get('kwargs', {}).get('pk'):
                # This is a list view, return only IDs
                return list(obj.questions.values_list('id', flat=True))
            else:
                # This is a detail view, return full details
                questions_data = []
                is_teacher = request and request.user.role == 'teacher'
                
                questions = sorted(obj.questions.all(), key=lambda q: q.id)
                for question in questions:
                    question_data = {
                        'id': question.id,
                        'public_id': question.public_id,
                        'question_text': question.question_text,
                        'difficulty_level': question.difficulty_level,
                        'folders': list(question.folders.values_list('id', flat=True)),
                        'folders_names': list(question.folders.values_list('name', flat=True)),
                        'options': [{'id': opt.id, 'option_text': opt.option_text, 'order': opt.order} for opt in question.options.all()],
                        'images': [{'id': img.id, 'image': img.image.url if img.image else '', 'alt_text': img.alt_text, 'order': img.order} for img in question.images.all()],
                        'created_at': question.created_at.isoformat(),
                        'updated_at': question.updated_at.isoformat(),
                        'publish_date': question.publish_date,
                        'source': question.source,
                        'is_active': question.is_active,
                    }
                    
                    # فقط برای معلم‌ها اطلاعات حساس را اضافه کن
                    if is_teacher:
                        question_data.update({
                            'correct_option': question.correct_option.id if question.correct_option else None,
                            'detailed_solution': question.detailed_solution,
                            'detailed_solution_images': [{'id': img.id, 'image': img.image.url if img.image else '', 'alt_text': img.alt_text, 'order': img.order} for img in question.detailed_solution_images.all()],
                        })
                    
                    questions_data.append(question_data)
                return questions_data
        else:
            # برای آزمون‌های PDF، فقط IDها را برمی‌گردان
            return list(obj.questions.values_list('id', flat=True))

    def get_folders(self, obj):
        """لیست ID پوشه‌های آزمون را برمی‌گرداند"""
        return list(obj.folders.values_list('id', flat=True))


class QuestionTestListSerializer(TestDetailSerializer):
    """سریالایزر مخصوص لیست آزمون‌های سوالی - فقط ID سوالات را برمی‌گرداند"""
    
    def get_questions(self, obj):
        """برای لیست view، فقط ID سوالات را برمی‌گرداند"""
        return list(obj.questions.values_list('id', flat=True))


class TestCollectionSerializer(serializers.ModelSerializer):
    """سریالایزر برای مجموعه آزمون"""
    tests_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    courses_info = CourseNestedSerializer(source='courses', many=True, read_only=True)
    courses = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Course.objects.all(),
        required=False
    )
    
    class Meta:
        model = TestCollection
        fields = [
            'id', 'name', 'description', 'is_active', 'is_public',
            'tests_count', 'students_count', 'courses', 'courses_info',
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
            'tests', 'created_at', 'updated_at', 'is_active', 'is_public'
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
    
    # Flexible dynamic path: array of {level, id}
    knowledge_path = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField(), allow_empty=False),
        required=False,
        write_only=True,
        help_text="Ordered list of levels: [{level: 'subject', id: 12}, ...]"
    )
    folders = serializers.PrimaryKeyRelatedField(queryset=Folder.objects.all(), many=True, required=False, allow_empty=True)

    class Meta:
        model = Test
        fields = [
            'id', 'name', 'description', 'topic', 'knowledge_path', 'folders',
            'pdf_file', 'answers_file', 'duration', 'keys', 'is_active'
        ]

    def validate_knowledge_path(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('knowledge_path must be a list')
        normalized = []
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f'Item {idx} must be an object with level and id')
            level = item.get('level')
            level_id = item.get('id')
            if not level or level_id in (None, ''):
                raise serializers.ValidationError(f'Item {idx} missing level or id')
            # Convert id to int if possible
            try:
                level_id = int(level_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(f'Item {idx} id must be integer-like')
            normalized.append({'level': level, 'id': level_id})
        return normalized

    def validate(self, attrs):
        # Ensure at least one of topic, knowledge_path, or folders provided
        topic = attrs.get('topic')
        kp = attrs.get('knowledge_path')
        folders = attrs.get('folders')
        if not topic and not kp and (not folders or len(folders) == 0):
            raise serializers.ValidationError('حداقل یکی از موارد زیر لازم است: topic یا knowledge_path یا folders')
        return super().validate(attrs)
        read_only_fields = ['teacher', 'test_type']
    
    def create(self, validated_data):
        keys_data = validated_data.pop('keys', [])
        validated_data['test_type'] = 'topic_based'  # Use string instead of TestType enum
        validated_data['teacher'] = self.context['request'].user
        
        # Dynamic path
        knowledge_path = validated_data.pop('knowledge_path', None)
        folders = validated_data.pop('folders', [])
        # Attach pending folders info pre-save so model.clean can validate
        test = Test(**validated_data)
        test._pending_folders = folders  # transient attribute used in model.clean
        test.save()
        if knowledge_path:
            test.knowledge_path = knowledge_path
            test.save(update_fields=['knowledge_path'])
        if folders:
            test.folders.set(folders)
        
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
    
    folders = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            'id', 'name', 'description', 'test_type', 'topic', 'topic_name',
            'topic_detail', 'pdf_file', 'answers_file', 'duration',
            'display_status', 'can_take_now', 'total_questions',
            'participants_count', 'is_active', 'created_at', 'keys', 'knowledge_path', 'folders'
        ]

    def get_folders(self, obj):
        return [{'id': f.id, 'name': f.name, 'path_ids': f.path_ids} for f in obj.folders.all()]
    
    def get_topic_detail(self, obj):
        if obj.topic:
            return {
                'id': obj.topic.id,
                'name': obj.topic.name,
                'topic_category': obj.topic.topic_category.name if obj.topic.topic_category else 'نامشخص',
                'lesson': obj.topic.topic_category.lesson.name if obj.topic.topic_category else 'نامشخص',
                'section': obj.topic.topic_category.lesson.section.name if obj.topic.topic_category else 'نامشخص',
                'chapter': obj.topic.topic_category.lesson.section.chapter.name if obj.topic.topic_category else 'نامشخص',
                'subject': obj.topic.topic_category.lesson.section.chapter.subject.name if obj.topic.topic_category else 'نامشخص',
                'difficulty': obj.topic.difficulty
            }
        return None
    
    def get_can_take_now(self, obj):
        return obj.can_student_take_now()


class StartTopicTestSerializer(serializers.Serializer):
    """سریالایزر برای شروع آزمون مبحثی"""
    test_id = serializers.IntegerField()
    device_id = serializers.CharField(max_length=200, required=False)


class OptionSerializer(serializers.ModelSerializer):
    option_image = Base64ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Option
        fields = ['id', 'option_text', 'order', 'option_image']


class QuestionImageSerializer(serializers.ModelSerializer):
    image = Base64ImageField(required=False)
    
    class Meta:
        model = QuestionImage
        fields = ['id', 'image', 'alt_text', 'order']


class DetailedSolutionImageSerializer(serializers.ModelSerializer):
    image = Base64ImageField(required=False)
    
    class Meta:
        model = DetailedSolutionImage
        fields = ['id', 'image', 'alt_text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    images = QuestionImageSerializer(many=True, read_only=True)
    detailed_solution_images = DetailedSolutionImageSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    folders_names = serializers.SerializerMethodField()

    class Meta:
        model = Question
        # fields = [
        #     'id', 'public_id', 'question_text', 'folders', 'folders_names', 'created_at', 'updated_at',
        #     'created_by', 'created_by_name', 'difficulty_level', 'detailed_solution',
        #     'is_active', 'correct_option', 'options', 'images', 'publish_date', ' source'
        # ]
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'public_id']

    def get_folders_names(self, obj):
        """برگرداندن نام پوشه‌ها به عنوان آرایه"""
        return obj.get_folders_names()

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        validated_data['created_by'] = user
        return super().create(validated_data)


class QuestionCreateSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False, write_only=True)
    images = QuestionImageSerializer(many=True, required=False, write_only=True)
    detailed_solution_images = DetailedSolutionImageSerializer(many=True, required=False, write_only=True)
    correct_option_index = serializers.IntegerField(required=False, write_only=True)
    keep_image_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        help_text="List of image IDs to keep. Others will be deleted."
    )
    keep_detailed_solution_image_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        help_text="List of detailed solution image IDs to keep. Others will be deleted."
    )

    class Meta:
        model = Question
        fields = [
            'question_text', 'folders', 'difficulty_level', 'detailed_solution',
            'is_active', 'correct_option', 'options', 'images', 'detailed_solution_images', 'correct_option_index',
            'publish_date', 'source', 'keep_image_ids', 'keep_detailed_solution_image_ids'
        ]
        # حل مشکل nested fields برای update
        extra_kwargs = {
            'options': {'required': False},
            'images': {'required': False},
            'detailed_solution_images': {'required': False},
            'keep_image_ids': {'required': False},
            'keep_detailed_solution_image_ids': {'required': False},
        }

    def create(self, validated_data):
        print("=== QUESTION CREATION DEBUG ===")
        print("Raw validated_data keys:", list(validated_data.keys()))
        print("Raw validated_data:", validated_data)
        
        request = self.context.get('request')
        user = request.user if request else None
        validated_data['created_by'] = user

        options_data = validated_data.pop('options', [])
        images_data = validated_data.pop('images', [])
        detailed_solution_images_data = validated_data.pop('detailed_solution_images', [])
        folders_data = validated_data.pop('folders', [])
        correct_option_index = validated_data.pop('correct_option_index', None)

        print("Extracted options_data:", options_data)
        print("Extracted images_data:", images_data)
        print("Extracted detailed_solution_images_data:", detailed_solution_images_data)
        print("Extracted folders_data:", folders_data)
        print("correct_option_index:", correct_option_index)

        question = Question.objects.create(**validated_data)
        print("Created question:", question.id)
        
        # Set folders using set() method for many-to-many
        if folders_data:
            question.folders.set(folders_data)
            print("Set folders:", folders_data)

        # Create options
        created_options = []
        for option_data in options_data:
            print("Creating option:", option_data)
            option = Option.objects.create(question=question, **option_data)
            created_options.append(option)
            print("Created option:", option.id, option.option_text)

        # Set correct option if index is provided
        if correct_option_index is not None and 0 <= correct_option_index < len(created_options):
            question.correct_option = created_options[correct_option_index]
            question.save()
            print("Set correct option:", created_options[correct_option_index].id)

        for image_data in images_data:
            QuestionImage.objects.create(question=question, **image_data)

        # Create detailed solution images
        for ds_image_data in detailed_solution_images_data:
            DetailedSolutionImage.objects.create(question=question, **ds_image_data)

        print("=== QUESTION CREATION COMPLETE ===")
        return question

    def update(self, instance, validated_data):
        """Update question including folders, options (replace all), images, and correct option.
        Expects optional 'correct_option_index' referring to the index in the provided options array (after filtering/ordering on client).
        """
        print("=== QUESTION UPDATE DEBUG ===")
        print("Raw validated_data:", validated_data)
        
        # Pop nested write-only fields
        options_data = validated_data.pop('options', None)
        images_data = validated_data.pop('images', None)
        detailed_solution_images_data = validated_data.pop('detailed_solution_images', None)
        folders_data = validated_data.pop('folders', None)
        correct_option_index = validated_data.pop('correct_option_index', None)
        keep_image_ids = validated_data.pop('keep_image_ids', None)
        keep_detailed_solution_image_ids = validated_data.pop('keep_detailed_solution_image_ids', None)

        print("Extracted options_data:", options_data)
        print("Extracted images_data:", images_data)
        print("Extracted detailed_solution_images_data:", detailed_solution_images_data)
        print("Extracted folders_data:", folders_data)
        print("correct_option_index:", correct_option_index)
        print("keep_image_ids:", keep_image_ids)
        print("keep_detailed_solution_image_ids:", keep_detailed_solution_image_ids)

        # Update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update folders if provided
        if folders_data is not None:
            instance.folders.set(folders_data)
            print("Updated folders:", folders_data)

        created_options = []
        # Replace options if provided
        if options_data is not None:
            # Delete existing options
            Option.objects.filter(question=instance).delete()
            print("Deleted existing options")
            
            # Recreate options in given order
            for opt_idx, opt in enumerate(options_data):
                option_image = opt.get('option_image')
                # Modify filename for option images
                if option_image and hasattr(option_image, 'name') and option_image.name:
                    name_parts = option_image.name.split('.')
                    if len(name_parts) > 1:
                        ext = name_parts[-1]
                        new_name = f"{instance.public_id}_option_{opt_idx + 1}.{ext}"
                        # Create new file object with the new name
                        from django.core.files.uploadedfile import SimpleUploadedFile
                        new_file = SimpleUploadedFile(
                            name=new_name,
                            content=option_image.read(),
                            content_type=getattr(option_image, 'content_type', None)
                        )
                        option_image = new_file
                
                print("Creating option:", opt)
                option = Option.objects.create(
                    question=instance,
                    option_text=opt.get('option_text', ''),
                    order=opt.get('order') or (len(created_options) + 1),
                    option_image=option_image
                )
                created_options.append(option)
                print("Created option:", option.id, option.option_text)

        # Handle images: keep specified IDs, replace/add new ones
        if keep_image_ids is not None or images_data is not None:
            # Delete images not in keep_image_ids
            if keep_image_ids is not None:
                QuestionImage.objects.filter(question=instance).exclude(id__in=keep_image_ids).delete()
                print(f"Deleted images not in keep_image_ids: {keep_image_ids}")
            else:
                # If no keep_image_ids specified, delete all existing images
                QuestionImage.objects.filter(question=instance).delete()
                print("Deleted all existing images")
            
            # Add new images if provided
            if images_data and len(images_data) > 0:
                print("Adding new images")
                # Get the current max order for existing images
                existing_max_order = QuestionImage.objects.filter(question=instance).aggregate(max_order=models.Max('order'))['max_order'] or 0
                for idx, img in enumerate(images_data):
                    image_file = img.get('image')
                    # Modify filename to include question public_id and index
                    if hasattr(image_file, 'name') and image_file.name:
                        # Extract file extension
                        name_parts = image_file.name.split('.')
                        if len(name_parts) > 1:
                            ext = name_parts[-1]
                            # Generate new filename: question_public_id_index.ext
                            new_name = f"{instance.public_id}_{existing_max_order + idx + 1}.{ext}"
                            # Create new file object with the new name
                            from django.core.files.uploadedfile import SimpleUploadedFile
                            new_file = SimpleUploadedFile(
                                name=new_name,
                                content=image_file.read(),
                                content_type=getattr(image_file, 'content_type', None)
                            )
                            image_file = new_file
                    
                    QuestionImage.objects.create(
                        question=instance,
                        image=image_file,
                        alt_text=img.get('alt_text'),
                        order=existing_max_order + idx + 1
                    )
                    print("Created image")

        # Handle detailed solution images: keep specified IDs, replace/add new ones
        if keep_detailed_solution_image_ids is not None or detailed_solution_images_data is not None:
            # Delete images not in keep_detailed_solution_image_ids
            if keep_detailed_solution_image_ids is not None:
                DetailedSolutionImage.objects.filter(question=instance).exclude(id__in=keep_detailed_solution_image_ids).delete()
                print(f"Deleted detailed solution images not in keep_detailed_solution_image_ids: {keep_detailed_solution_image_ids}")
            else:
                # If no keep_detailed_solution_image_ids specified, delete all existing images
                DetailedSolutionImage.objects.filter(question=instance).delete()
                print("Deleted all existing detailed solution images")
            
            # Add new detailed solution images if provided
            if detailed_solution_images_data and len(detailed_solution_images_data) > 0:
                print("Adding new detailed solution images")
                # Get the current max order for existing images
                existing_max_order = DetailedSolutionImage.objects.filter(question=instance).aggregate(max_order=models.Max('order'))['max_order'] or 0
                for idx, img in enumerate(detailed_solution_images_data):
                    image_file = img.get('image')
                    
                    # Modify filename to include question public_id and index
                    if hasattr(image_file, 'name') and image_file.name:
                        # Extract file extension
                        name_parts = image_file.name.split('.')
                        if len(name_parts) > 1:
                            ext = name_parts[-1]
                            # Generate new filename: question_public_id_ds_index.ext
                            new_name = f"{instance.public_id}_ds_{existing_max_order + idx + 1}.{ext}"
                            # Create new file object with the new name
                            from django.core.files.uploadedfile import SimpleUploadedFile
                            new_file = SimpleUploadedFile(
                                name=new_name,
                                content=image_file.read(),
                                content_type=getattr(image_file, 'content_type', None)
                            )
                            image_file = new_file
                    
                    DetailedSolutionImage.objects.create(
                        question=instance,
                        image=image_file,
                        alt_text=img.get('alt_text'),
                        order=existing_max_order + idx + 1
                    )
                    print("Created detailed solution image")

        # Handle correct option by index if provided and options were provided/rebuilt
        if correct_option_index is not None and created_options:
            try:
                instance.correct_option = created_options[int(correct_option_index)]
                instance.save(update_fields=['correct_option'])
                print("Set correct option:", created_options[correct_option_index].id)
            except (ValueError, IndexError):
                # Ignore invalid index
                print("Invalid correct_option_index:", correct_option_index)
                pass
        elif correct_option_index is not None and options_data is None:
            # If correct_option_index provided but no options_data, set from existing options
            existing_options = list(Option.objects.filter(question=instance).order_by('order'))
            try:
                if 0 <= int(correct_option_index) < len(existing_options):
                    instance.correct_option = existing_options[int(correct_option_index)]
                    instance.save(update_fields=['correct_option'])
                    print("Set correct option from existing:", existing_options[correct_option_index].id)
            except (ValueError, IndexError):
                print("Invalid correct_option_index for existing options:", correct_option_index)
                pass

        print("=== QUESTION UPDATE COMPLETE ===")
        return instance


class QuestionCollectionSerializer(serializers.ModelSerializer):
    """Serializer for listing and basic operations on QuestionCollection"""
    total_questions = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionCollection
        fields = [
            'id', 'name', 'description', 'is_active', 
            'created_at', 'updated_at', 'total_questions', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_questions', 'created_by_name']
    
    def get_total_questions(self, obj):
        return obj.get_total_questions()
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class QuestionCollectionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for QuestionCollection with questions"""
    questions = QuestionSerializer(many=True, read_only=True)
    total_questions = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionCollection
        fields = [
            'id', 'name', 'description', 'is_active',
            'created_at', 'updated_at', 'questions', 'total_questions', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'questions', 'total_questions', 'created_by_name']
    
    def get_total_questions(self, obj):
        return obj.get_total_questions()
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class QuestionCollectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating QuestionCollection"""
    question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of question IDs to add to this collection"
    )
    
    class Meta:
        model = QuestionCollection
        fields = ['name', 'description', 'is_active', 'question_ids']
    
    def create(self, validated_data):
        question_ids = validated_data.pop('question_ids', [])
        
        # Set created_by from request user
        validated_data['created_by'] = self.context['request'].user
        
        collection = QuestionCollection.objects.create(**validated_data)
        
        # Add questions if provided
        if question_ids:
            questions = Question.objects.filter(id__in=question_ids, is_active=True)
            collection.questions.set(questions)
        
        return collection


class QuestionCollectionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating QuestionCollection"""
    question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of question IDs to replace current questions"
    )
    add_question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of question IDs to add to current questions"
    )
    remove_question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of question IDs to remove from current questions"
    )
    
    class Meta:
        model = QuestionCollection
        fields = ['name', 'description', 'is_active', 'question_ids', 'add_question_ids', 'remove_question_ids']
    
    def update(self, instance, validated_data):
        question_ids = validated_data.pop('question_ids', None)
        add_question_ids = validated_data.pop('add_question_ids', None)
        remove_question_ids = validated_data.pop('remove_question_ids', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle question operations
        if question_ids is not None:
            # Replace all questions
            questions = Question.objects.filter(id__in=question_ids, is_active=True)
            instance.questions.set(questions)
        else:
            # Add questions
            if add_question_ids:
                questions_to_add = Question.objects.filter(id__in=add_question_ids, is_active=True)
                instance.questions.add(*questions_to_add)
            
            # Remove questions
            if remove_question_ids:
                questions_to_remove = Question.objects.filter(id__in=remove_question_ids)
                instance.questions.remove(*questions_to_remove)
        
        return instance

