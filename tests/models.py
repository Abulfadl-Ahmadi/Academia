from django.db import models
from contents.models import File
from accounts.models import User
from courses.models import Course
from django.utils import timezone
from datetime import timedelta


class TestCollection(models.Model):
    """
    مجموعه آزمون - مجموعه‌ای از آزمون‌ها که می‌تواند مستقل یا متصل به دوره باشد
    """
    name = models.CharField(max_length=255, verbose_name="نام مجموعه آزمون")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    # اتصال به دوره‌ها (یک مجموعه آزمون می‌تواند به چندین دوره متصل باشد)
    courses = models.ManyToManyField(
        Course, 
        related_name='test_collections', 
        blank=True,
        verbose_name="دوره‌های مرتبط"
    )
    
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_test_collections',
        limit_choices_to={"role": "teacher"},
        verbose_name="ایجاد شده توسط"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ آخرین بروزرسانی")

    class Meta:
        verbose_name = "مجموعه آزمون"
        verbose_name_plural = "مجموعه‌های آزمون"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_accessible_students(self):
        """
        دانش‌آموزانی که به این مجموعه آزمون دسترسی دارند
        (دانش‌آموزان دوره‌های متصل + محصولات خریداری شده)
        """
        # دانش‌آموزان دوره‌های متصل
        course_students = User.objects.filter(
            enrolled_courses__in=self.courses.all(),
            role='student'
        ).distinct()
        
        # اینجا بعداً دانش‌آموزان محصولات خریداری شده را اضافه خواهیم کرد
        return course_students

    def get_total_tests(self):
        """تعداد کل آزمون‌های این مجموعه"""
        return self.tests.count()

    def get_completed_tests_for_student(self, student):
        """تعداد آزمون‌های تکمیل شده برای دانش‌آموز مشخص"""
        return self.tests.filter(
            studenttestsession__user=student,
            studenttestsession__status='completed'
        ).distinct().count()

    def get_student_progress(self, student):
        """درصد پیشرفت دانش‌آموز در این مجموعه آزمون"""
        total = self.get_total_tests()
        if total == 0:
            return 0
        completed = self.get_completed_tests_for_student(student)
        return (completed / total) * 100


class Test(models.Model):
    name = models.CharField(max_length=255, verbose_name="نام آزمون")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="معلم")
    
    # اتصال به مجموعه آزمون (الزامی)
    test_collection = models.ForeignKey(
        TestCollection, 
        on_delete=models.CASCADE, 
        related_name='tests',
        verbose_name="مجموعه آزمون"
    )
    
    pdf_file = models.ForeignKey(File, on_delete=models.CASCADE, verbose_name="فایل PDF")
    start_time = models.DateTimeField(verbose_name="زمان شروع")
    end_time = models.DateTimeField(verbose_name="زمان پایان")
    duration = models.DurationField(verbose_name="مدت زمان آزمون")
    frequency = models.CharField(max_length=100, verbose_name="تکرار")  # e.g. 'once', 'weekly', etc.
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ آخرین بروزرسانی")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        verbose_name = "آزمون"
        verbose_name_plural = "آزمون‌ها"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.test_collection.name}"

    def get_accessible_students(self):
        """دانش‌آموزانی که به این آزمون دسترسی دارند"""
        return self.test_collection.get_accessible_students()

    def get_participants_count(self):
        """تعداد شرکت‌کنندگان در آزمون"""
        return self.studenttestsession_set.values('user').distinct().count()

    def get_completed_count(self):
        """تعداد کسانی که آزمون را تکمیل کرده‌اند"""
        return self.studenttestsession_set.filter(status='completed').count()

    def get_average_score(self):
        """میانگین نمرات آزمون"""
        from django.db.models import Avg
        sessions = self.studenttestsession_set.filter(status='completed')
        if sessions.exists():
            # محاسبه نمره بر اساس تعداد پاسخ‌های صحیح
            total_score = 0
            count = 0
            for session in sessions:
                correct_answers = 0
                total_questions = self.primary_keys.count()
                for answer in session.answers.all():
                    primary_key = self.primary_keys.filter(question_number=answer.question_number).first()
                    if primary_key and primary_key.answer == answer.answer:
                        correct_answers += 1
                if total_questions > 0:
                    score = (correct_answers / total_questions) * 100
                    total_score += score
                    count += 1
            return total_score / count if count > 0 else 0
        return 0

    def get_top_students(self, limit=10):
        """برترین دانش‌آموزان آزمون"""
        sessions = self.studenttestsession_set.filter(status='completed').select_related('user')
        student_scores = []
        
        for session in sessions:
            correct_answers = 0
            total_questions = self.primary_keys.count()
            for answer in session.answers.all():
                primary_key = self.primary_keys.filter(question_number=answer.question_number).first()
                if primary_key and primary_key.answer == answer.answer:
                    correct_answers += 1
            
            if total_questions > 0:
                score = (correct_answers / total_questions) * 100
                student_scores.append({
                    'student': session.user,
                    'score': score,
                    'session': session
                })
        
        # مرتب‌سازی بر اساس نمره
        student_scores.sort(key=lambda x: x['score'], reverse=True)
        return student_scores[:limit]

class PrimaryKey(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='primary_keys')
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
    answer = models.IntegerField(null=True, blank=True)


class StudentProgress(models.Model):
    """پیشرفت دانش‌آموز در یک مجموعه آزمون"""
    test_collection = models.ForeignKey(
        TestCollection,
        on_delete=models.CASCADE,
        related_name="student_progresses",
        verbose_name="مجموعه آزمون"
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="test_progresses",
        verbose_name="دانش‌آموز",
        limit_choices_to={'role': 'student'}
    )
    
    # اطلاعات پیشرفت
    completed_tests = models.PositiveIntegerField(default=0, verbose_name="آزمون‌های تکمیل‌شده")
    total_score = models.FloatField(default=0, verbose_name="مجموع امتیاز")
    
    # تاریخ‌ها
    started_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ شروع")
    last_activity = models.DateTimeField(auto_now=True, verbose_name="آخرین فعالیت")
    
    # وضعیت
    is_completed = models.BooleanField(default=False, verbose_name="تکمیل‌شده")
    
    class Meta:
        verbose_name = "پیشرفت دانش‌آموز"
        verbose_name_plural = "پیشرفت دانش‌آموزان"
        unique_together = ['test_collection', 'student']
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.test_collection.name}"

    @property
    def progress_percentage(self):
        """درصد پیشرفت"""
        total_tests = self.test_collection.tests.count()
        if total_tests == 0:
            return 0
        return round((self.completed_tests / total_tests) * 100, 2)

    @property
    def average_score(self):
        """میانگین امتیاز"""
        if self.completed_tests == 0:
            return 0
        return round(self.total_score / self.completed_tests, 2)

    def update_progress(self):
        """به‌روزرسانی پیشرفت بر اساس آزمون‌های تکمیل‌شده"""        
        # آزمون‌های تکمیل‌شده در این مجموعه
        completed_sessions = StudentTestSession.objects.filter(
            test__test_collection=self.test_collection,
            user=self.student,
            status='completed'
        )
        
        self.completed_tests = completed_sessions.count()
        self.total_score = sum(session.final_score for session in completed_sessions if session.final_score)
        
        # چک کردن تکمیل کامل
        if self.completed_tests >= self.test_collection.tests.count():
            self.is_completed = True
        
        self.save()
