from rest_framework import serializers
from django.utils import timezone
from django.db.models import Count, Q
from .models import CustomTest, CustomTestSession, CustomTestStatus, Question
from knowledge.models import Folder
from accounts.models import User


class CustomTestCreateSerializer(serializers.Serializer):
    """
    Serializer برای ایجاد آزمون شخصی‌سازی شده
    """
    name = serializers.CharField(max_length=255, required=True)
    folders = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    difficulty_level = serializers.ChoiceField(
        choices=Question.DIFFICULTY_CHOICES,
        required=False,
        allow_null=True
    )
    questions_count = serializers.IntegerField(min_value=1, max_value=100, required=True)
    duration_minutes = serializers.IntegerField(min_value=5, max_value=300, required=True)
    
    def validate_folders(self, value):
        """اعتبارسنجی پوشه‌ها"""
        if value:
            existing_folders = Folder.objects.filter(id__in=value).count()
            if existing_folders != len(value):
                raise serializers.ValidationError("برخی از پوشه‌های انتخاب شده معتبر نیستند")
        return value
    
    def validate(self, data):
        """اعتبارسنجی کلی"""
        # بررسی تعداد سوالات موجود با فیلترهای انتخاب شده
        filters = Q(is_active=True)
        
        if data.get('folders'):
            filters &= Q(folders__id__in=data['folders'])
        
        if data.get('difficulty_level'):
            filters &= Q(difficulty_level=data['difficulty_level'])
        
        available_questions = Question.objects.filter(filters).distinct().count()
        
        if available_questions < data['questions_count']:
            raise serializers.ValidationError({
                'questions_count': f'تنها {available_questions} سوال با فیلترهای انتخاب شده موجود است. لطفاً تعداد کمتری را انتخاب کنید.'
            })
        
        return data
    
    def create(self, validated_data):
        """ایجاد آزمون شخصی با سوالات تصادفی"""
        user = self.context['request'].user
        
        # استخراج داده‌ها
        name = validated_data['name']
        folders = validated_data.get('folders', [])
        difficulty_level = validated_data.get('difficulty_level')
        questions_count = validated_data['questions_count']
        duration_minutes = validated_data['duration_minutes']
        
        # ایجاد آزمون
        custom_test = CustomTest.objects.create(
            student=user,
            name=name,
            difficulty_level=difficulty_level,
            questions_count=questions_count,
            duration=timezone.timedelta(minutes=duration_minutes),
            status=CustomTestStatus.NOT_STARTED
        )
        
        # اضافه کردن پوشه‌ها
        if folders:
            custom_test.folders.set(folders)
        
        # انتخاب تصادفی سوالات
        filters = Q(is_active=True)
        
        if folders:
            filters &= Q(folders__id__in=folders)
        
        if difficulty_level:
            filters &= Q(difficulty_level=difficulty_level)
        
        # انتخاب سوالات به صورت تصادفی
        random_questions = Question.objects.filter(filters).distinct().order_by('?')[:questions_count]
        custom_test.questions.set(random_questions)
        
        return custom_test


class CustomTestListSerializer(serializers.ModelSerializer):
    """
    Serializer برای لیست آزمون‌های شخصی
    """
    folders_names = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    actual_questions_count = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomTest
        fields = [
            'id', 'name', 'status', 'difficulty_level',
            'questions_count', 'actual_questions_count',
            'duration_minutes', 'score', 'folders_names',
            'created_at', 'started_at', 'completed_at',
            'completion_percentage', 'is_expired'
        ]
    
    def get_folders_names(self, obj):
        """دریافت نام پوشه‌ها"""
        return [folder.name for folder in obj.folders.all()]
    
    def get_duration_minutes(self, obj):
        """تبدیل duration به دقیقه"""
        return int(obj.duration.total_seconds() / 60)
    
    def get_actual_questions_count(self, obj):
        """تعداد واقعی سوالات"""
        return obj.questions.count()
    
    def get_completion_percentage(self, obj):
        """درصد تکمیل آزمون"""
        if obj.status == CustomTestStatus.NOT_STARTED:
            return 0
        elif obj.status == CustomTestStatus.COMPLETED:
            return 100
        else:
            # محاسبه بر اساس سوالات پاسخ داده شده
            answered = obj.custom_answers.filter(student=obj.student).count()
            total = obj.questions.count()
            return int((answered / total) * 100) if total > 0 else 0
    
    def get_is_expired(self, obj):
        """بررسی انقضا"""
        return obj.is_expired()


class QuestionOptionSerializer(serializers.Serializer):
    """Serializer برای گزینه‌های سوال"""
    id = serializers.IntegerField()
    option_text = serializers.CharField()
    order = serializers.IntegerField()


class CustomTestQuestionSerializer(serializers.Serializer):
    """Serializer برای سوالات آزمون شخصی"""
    id = serializers.IntegerField()
    public_id = serializers.CharField()
    question_text = serializers.CharField()
    difficulty_level = serializers.CharField()
    options = QuestionOptionSerializer(many=True)
    question_image_urls = serializers.SerializerMethodField()
    
    def get_question_image_urls(self, obj):
        """دریافت URL تصاویر سوال"""
        request = self.context.get('request')
        images = obj.images.all().order_by('order')
        if request:
            return [request.build_absolute_uri(img.image.url) for img in images]
        return [img.image.url for img in images]


class CustomTestDetailSerializer(serializers.ModelSerializer):
    """
    Serializer برای جزئیات کامل آزمون شخصی
    """
    folders_names = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    questions_list = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomTest
        fields = [
            'id', 'name', 'status', 'difficulty_level',
            'questions_count', 'duration_minutes', 'score',
            'folders_names', 'created_at', 'started_at',
            'completed_at', 'questions_list', 'time_remaining',
            'is_expired'
        ]
    
    def get_folders_names(self, obj):
        """دریافت نام پوشه‌ها"""
        return [folder.name for folder in obj.folders.all()]
    
    def get_duration_minutes(self, obj):
        """تبدیل duration به دقیقه"""
        return int(obj.duration.total_seconds() / 60)
    
    def get_questions_list(self, obj):
        """لیست سوالات"""
        questions = obj.questions.all().prefetch_related('options', 'images')
        return CustomTestQuestionSerializer(
            questions, 
            many=True, 
            context=self.context
        ).data
    
    def get_time_remaining(self, obj):
        """زمان باقیمانده به ثانیه"""
        if obj.status != CustomTestStatus.IN_PROGRESS or not obj.started_at:
            return None
        
        elapsed = timezone.now() - obj.started_at
        total_seconds = obj.duration.total_seconds()
        remaining = total_seconds - elapsed.total_seconds()
        
        return max(0, int(remaining))
    
    def get_is_expired(self, obj):
        """بررسی انقضا"""
        return obj.is_expired()


class CustomTestStartSerializer(serializers.Serializer):
    """Serializer برای شروع آزمون"""
    
    def update(self, instance, validated_data):
        """شروع آزمون"""
        if instance.status != CustomTestStatus.NOT_STARTED:
            raise serializers.ValidationError("این آزمون قبلاً شروع شده است")
        
        instance.status = CustomTestStatus.IN_PROGRESS
        instance.started_at = timezone.now()
        instance.save()
        
        # ایجاد session
        CustomTestSession.objects.get_or_create(
            custom_test=instance,
            student=instance.student
        )
        
        return instance


class CustomTestSubmitSerializer(serializers.Serializer):
    """Serializer برای ثبت پاسخ سوال"""
    question_id = serializers.IntegerField(required=True)
    option_id = serializers.IntegerField(required=True)
    
    def validate_question_id(self, value):
        """اعتبارسنجی سوال"""
        custom_test = self.context.get('custom_test')
        if not custom_test.questions.filter(id=value).exists():
            raise serializers.ValidationError("این سوال در آزمون وجود ندارد")
        return value
    
    def validate_option_id(self, value):
        """اعتبارسنجی گزینه"""
        from .models import Option
        if not Option.objects.filter(id=value).exists():
            raise serializers.ValidationError("گزینه انتخاب شده معتبر نیست")
        return value
    
    def create(self, validated_data):
        """ثبت پاسخ"""
        from .models import CustomTestAnswer, Option
        
        custom_test = self.context['custom_test']
        student = custom_test.student
        question_id = validated_data['question_id']
        option_id = validated_data['option_id']
        
        question = Question.objects.get(id=question_id)
        option = Option.objects.get(id=option_id)
        
        # ثبت یا بروزرسانی پاسخ
        answer, created = CustomTestAnswer.objects.update_or_create(
            custom_test=custom_test,
            student=student,
            question=question,
            defaults={'selected_option': option}
        )
        
        return answer


class CustomTestFinishSerializer(serializers.Serializer):
    """Serializer برای پایان دادن به آزمون"""
    
    def update(self, instance, validated_data):
        """پایان دادن به آزمون و محاسبه نمره"""
        if instance.status not in [CustomTestStatus.IN_PROGRESS, CustomTestStatus.NOT_STARTED]:
            raise serializers.ValidationError("این آزمون قبلاً تمام شده است")
        
        instance.status = CustomTestStatus.COMPLETED
        instance.completed_at = timezone.now()
        instance.score = instance.calculate_score()
        instance.save()
        
        return instance


class CustomTestStatsSerializer(serializers.Serializer):
    """Serializer برای آمار آزمون‌های شخصی دانش‌آموز"""
    total_tests = serializers.IntegerField()
    completed_tests = serializers.IntegerField()
    in_progress_tests = serializers.IntegerField()
    average_score = serializers.FloatField()
    total_questions_answered = serializers.IntegerField()
    best_score = serializers.FloatField()
    worst_score = serializers.FloatField()
