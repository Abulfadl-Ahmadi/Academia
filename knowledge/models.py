from django.db import models
from accounts.models import User
from django.utils.translation import gettext_lazy as _


class Subject(models.Model):
    """کتاب درسی - مثل هندسه دهم، حسابان یازدهم"""
    name = models.CharField(max_length=100, verbose_name="نام کتاب")
    grade = models.IntegerField(verbose_name="پایه تحصیلی")  # 10, 11, 12
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    cover_image = models.ImageField(upload_to='subjects/', blank=True, null=True, verbose_name="تصویر جلد")
    
    # فایل کتاب
    book_file = models.ForeignKey(
        'contents.File',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subject_books',
        limit_choices_to={'content_type': 'book'},
        verbose_name="فایل کتاب",
        help_text="فایل PDF کتاب درسی"
    )
    
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "کتاب درسی"
        verbose_name_plural = "کتاب‌های درسی"
        ordering = ['grade', 'name']
        unique_together = ['name', 'grade']
    
    def __str__(self):
        return f"{self.name} - پایه {self.grade}"
    
    def get_total_topics(self):
        """تعداد کل مباحث این کتاب"""
        return Topic.objects.filter(section__chapter__subject=self).count()


class Chapter(models.Model):
    """فصل کتاب - مثل فصل دوم: هندسه مسطحه"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters', verbose_name="کتاب")
    name = models.CharField(max_length=200, verbose_name="نام فصل")
    order = models.PositiveIntegerField(verbose_name="ترتیب")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "فصل"
        verbose_name_plural = "فصل‌ها"
        ordering = ['subject', 'order']
        unique_together = ['subject', 'order']
    
    def __str__(self):
        return f"{self.subject.name} - فصل {self.order}: {self.name}"
    
    def get_total_topics(self):
        """تعداد کل مباحث این فصل"""
        return Topic.objects.filter(section__chapter=self).count()


class Section(models.Model):
    """زیربخش فصل - مثل قضایا و تئوری‌ها"""
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='sections', verbose_name="فصل")
    name = models.CharField(max_length=200, verbose_name="نام زیربخش")
    order = models.PositiveIntegerField(verbose_name="ترتیب")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "زیربخش"
        verbose_name_plural = "زیربخش‌ها"
        ordering = ['chapter', 'order']
        unique_together = ['chapter', 'order']
    
    def __str__(self):
        return f"{self.chapter.name} - {self.name}"


class DifficultyLevel(models.TextChoices):
    BEGINNER = 'beginner', 'مبتدی'
    INTERMEDIATE = 'intermediate', 'متوسط' 
    ADVANCED = 'advanced', 'پیشرفته'
    EXPERT = 'expert', 'تخصصی'


class Topic(models.Model):
    """مبحث نهایی - مثل قضیه تالس، نظریه فیثاغورث"""
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='topics', verbose_name="زیربخش")
    name = models.CharField(max_length=200, verbose_name="نام مبحث")
    order = models.PositiveIntegerField(verbose_name="ترتیب")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    # سطح دشواری
    difficulty = models.CharField(
        max_length=20, 
        choices=DifficultyLevel.choices, 
        default=DifficultyLevel.INTERMEDIATE,
        verbose_name="سطح دشواری"
    )
    
    # پیش‌نیازها
    prerequisites = models.ManyToManyField(
        'self', 
        symmetrical=False,
        blank=True,
        verbose_name="پیش‌نیازها",
        help_text="مباحثی که باید قبل از این مبحث یاد گرفته شوند"
    )
    
    # تگ‌ها برای دسته‌بندی بهتر
    tags = models.CharField(max_length=500, blank=True, verbose_name="تگ‌ها", help_text="تگ‌ها را با کاما جدا کنید")
    
    # زمان تخمینی مطالعه (به دقیقه)
    estimated_study_time = models.PositiveIntegerField(
        default=30, 
        verbose_name="زمان تخمینی مطالعه (دقیقه)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "مبحث"
        verbose_name_plural = "مباحث"
        ordering = ['section', 'order']
        unique_together = ['section', 'order']
    
    def __str__(self):
        return f"{self.section.chapter.subject.name} - {self.name}"
    
    def get_available_tests_count(self):
        """تعداد آزمون‌های موجود برای این مبحث"""
        return self.topic_tests.filter(is_active=True).count()
    
    def get_random_test(self):
        """انتخاب تصادفی یک آزمون از آزمون‌های این مبحث"""
        from tests.models import Test
        import random
        
        available_tests = list(self.topic_tests.filter(is_active=True))
        if available_tests:
            return random.choice(available_tests)
        return None
    
    def get_skill_level_for_student(self, student):
        """محاسبه سطح مهارت دانش‌آموز در این مبحث"""
        from tests.models import StudentTestSession
        
        # آزمون‌های تکمیل‌شده در این مبحث
        completed_sessions = StudentTestSession.objects.filter(
            test__in=self.topic_tests.all(),
            user=student,
            status='completed'
        )
        
        if not completed_sessions.exists():
            return 0
        
        # محاسبه میانگین نمرات
        total_score = 0
        count = 0
        
        for session in completed_sessions:
            # محاسبه نمره این جلسه
            correct_answers = 0
            total_questions = session.test.get_total_questions()
            
            for answer in session.answers.all():
                primary_key = session.test.primary_keys.filter(
                    question_number=answer.question_number
                ).first()
                if primary_key and primary_key.answer == answer.answer:
                    correct_answers += 1
            
            if total_questions > 0:
                score = (correct_answers / total_questions) * 100
                total_score += score
                count += 1
        
        return round(total_score / count, 2) if count > 0 else 0


class StudentTopicProgress(models.Model):
    """پیشرفت دانش‌آموز در یک مبحث خاص"""
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='topic_progresses',
        verbose_name="دانش‌آموز"
    )
    topic = models.ForeignKey(
        Topic, 
        on_delete=models.CASCADE, 
        related_name='student_progresses',
        verbose_name="مبحث"
    )
    
    # آمار عملکرد
    tests_taken = models.PositiveIntegerField(default=0, verbose_name="تعداد آزمون‌های گرفته‌شده")
    total_score = models.FloatField(default=0, verbose_name="مجموع امتیاز")
    best_score = models.FloatField(default=0, verbose_name="بهترین امتیاز")
    
    # سطح مهارت فعلی (0-100)
    skill_level = models.FloatField(default=0, verbose_name="سطح مهارت")
    
    # وضعیت تسلط
    is_mastered = models.BooleanField(default=False, verbose_name="تسلط یافته")
    mastery_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ تسلط")
    
    # تاریخ‌ها
    first_attempt = models.DateTimeField(auto_now_add=True, verbose_name="اولین تلاش")
    last_attempt = models.DateTimeField(auto_now=True, verbose_name="آخرین تلاش")
    
    class Meta:
        verbose_name = "پیشرفت مبحثی"
        verbose_name_plural = "پیشرفت‌های مبحثی"
        unique_together = ['student', 'topic']
        ordering = ['-last_attempt']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.topic.name}"
    
    @property
    def average_score(self):
        """میانگین امتیاز"""
        if self.tests_taken == 0:
            return 0
        return round(self.total_score / self.tests_taken, 2)
    
    def update_progress(self):
        """به‌روزرسانی پیشرفت بر اساس آزمون‌های جدید"""
        self.skill_level = self.topic.get_skill_level_for_student(self.student)
        
        # اگر نمره بالای 80 باشد، تسلط یافته محسوب می‌شود
        if self.skill_level >= 80 and not self.is_mastered:
            self.is_mastered = True
            from django.utils import timezone
            self.mastery_date = timezone.now()
        
        self.save()
