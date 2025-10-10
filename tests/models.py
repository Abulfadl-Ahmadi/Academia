from django.db import models
from contents.models import File
from accounts.models import User
from courses.models import Course
from django.utils import timezone
from datetime import timedelta
from knowledge.models import Folder
import secrets
import hmac
import hashlib
from django.conf import settings
import uuid

# Base62 character set for secure ID generation
BASE62_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

def generate_secure_question_id():
    """
    تولید شناسه شش‌کاراکتری امن برای سوال با رقم کنترل
    ساختار: 5 کاراکتر تصادفی + 1 رقم کنترل
    """
    # گام 1: تولید 5 کاراکتر تصادفی از Base62
    core_id = ''.join(secrets.choice(BASE62_CHARS) for _ in range(5))
    
    # گام 2: محاسبه رقم کنترل با HMAC-SHA256
    control_digit = calculate_control_digit(core_id)
    
    # گام 3: ترکیب نهایی
    return core_id + control_digit

def calculate_control_digit(core_id):
    """
    محاسبه رقم کنترل با استفاده از HMAC-SHA256
    """
    # کلید مخفی از تنظیمات Django
    secret_key = getattr(settings, 'QUESTION_ID_SECRET', settings.SECRET_KEY)
    
    # محاسبه HMAC-SHA256
    mac = hmac.new(
        secret_key.encode('utf-8'),
        core_id.encode('utf-8'),
        hashlib.sha256
    )
    
    # گرفتن اولین بایت از هش و تبدیل به Base62
    control_index = mac.digest()[0] % 62
    return BASE62_CHARS[control_index]

def validate_question_id(question_id):
    """
    اعتبارسنجی شناسه شش‌کاراکتری سوال
    """
    if not question_id or len(question_id) != 6:
        return False
    
    # بررسی معتبر بودن کاراکترها
    if not all(c in BASE62_CHARS for c in question_id):
        return False
    
    # جداسازی 5 کاراکتر اول و رقم کنترل
    core_id = question_id[:5]
    provided_control = question_id[5]
    
    # محاسبه رقم کنترل مورد انتظار
    expected_control = calculate_control_digit(core_id)
    
    return provided_control == expected_control


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


class TestType(models.TextChoices):
    SCHEDULED = 'scheduled', 'آزمون زمان‌بندی شده'
    TOPIC_BASED = 'topic_based', 'آزمون مبحثی آزاد'
    PRACTICE = 'practice', 'آزمون تمرینی'

class TestContentType(models.TextChoices):
    PDF = 'pdf', 'فایل PDF'
    TYPED_QUESTION = 'typed_question', 'سوال تایپ شده'

class Test(models.Model):

    name = models.CharField(max_length=255, verbose_name="نام آزمون")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="معلم")
    
    test_type = models.CharField(
        max_length=20,
        choices=TestType.choices,
        default=TestType.SCHEDULED,
        verbose_name="نوع آزمون"
    )
    
    test_collection = models.ForeignKey(
        TestCollection, 
        on_delete=models.CASCADE, 
        related_name='tests',
        verbose_name="مجموعه آزمون",
        null=True,
        blank=True
    )
    
    topic = models.ForeignKey(
        'knowledge.Topic',
        on_delete=models.SET_NULL,
        related_name='topic_tests',
        verbose_name="مبحث مرتبط",
        null=True,
        blank=True,
        help_text="مبحث درخت دانشی که این آزمون به آن مربوط است"
    )
        
    pdf_file = models.ForeignKey(File, on_delete=models.CASCADE, verbose_name="فایل PDF", related_name='test_file', null=True, blank=True)
    answers_file = models.ForeignKey(File, on_delete=models.SET_NULL, verbose_name="فایل پاسخنامه", related_name='test_answers_file', null=True, blank=True)
    
    # فیلدهای زمان‌بندی (فقط برای آزمون‌های زمان‌بندی شده)
    start_time = models.DateTimeField(
        verbose_name="زمان شروع", 
        null=True, 
        blank=True,
        help_text="فقط برای آزمون‌های زمان‌بندی شده الزامی است"
    )
    end_time = models.DateTimeField(
        verbose_name="زمان پایان", 
        null=True, 
        blank=True,
        help_text="فقط برای آزمون‌های زمان‌بندی شده الزامی است"
    )
    duration = models.DurationField(verbose_name="مدت زمان آزمون")
    frequency = models.CharField(max_length=100, verbose_name="تکرار", blank=True, null=True)  # e.g. 'once', 'weekly', etc.
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ آخرین بروزرسانی")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    # مسیر سلسله مراتبی انتخاب‌شده وقتی topic نهایی موجود نیست
    knowledge_path = models.JSONField(null=True, blank=True, default=list, help_text="Path nodes when no final topic exists: list of {level: str, id: int | null}")
    folders = models.ManyToManyField(Folder, blank=True, related_name='tests', verbose_name="پوشه‌ها", help_text="پوشه(های) مرتبط برای آزمون مبحثی")

    questions = models.ManyToManyField('Question', blank=True, related_name='tests', verbose_name="سوالات")
    content_type = models.CharField(max_length=20, choices=TestContentType.choices, default=TestContentType.PDF, verbose_name="نوع محتوا")
    
    class Meta:
        verbose_name = "آزمون"
        verbose_name_plural = "آزمون‌ها"
        ordering = ['-created_at']
    
    def clean(self):
        """اعتبارسنجی مدل"""
        from django.core.exceptions import ValidationError
        
        # بررسی فیلدهای الزامی برای آزمون‌های زمان‌بندی شده
        if self.test_type == TestType.SCHEDULED:
            if not self.start_time:
                raise ValidationError({
                    'start_time': 'زمان شروع برای آزمون‌های زمان‌بندی شده الزامی است'
                })
            if not self.end_time:
                raise ValidationError({
                    'end_time': 'زمان پایان برای آزمون‌های زمان‌بندی شده الزامی است'
                })
            if not self.test_collection:
                raise ValidationError({
                    'test_collection': 'مجموعه آزمون برای آزمون‌های زمان‌بندی شده الزامی است'
                })
        
        # بررسی فیلدهای الزامی برای آزمون‌های مبحثی
        elif self.test_type == TestType.TOPIC_BASED:
            # Accept any of: final topic, knowledge_path, or at least one folder (including pending unsaved m2m passed by serializer)
            pending_folders = getattr(self, '_pending_folders', None)
            has_folders = False
            if pending_folders:
                try:
                    has_folders = len(pending_folders) > 0
                except TypeError:
                    has_folders = False
            else:
                # Only reliable after initial save; during first save m2m not yet available
                if self.pk:
                    has_folders = self.folders.exists()
            if not self.topic and not (self.knowledge_path and len(self.knowledge_path) > 0) and not has_folders:
                raise ValidationError({
                    'topic': 'برای آزمون مبحثی باید یکی از این‌ها انتخاب شود: مبحث نهایی، مسیر دانش (knowledge_path) یا حداقل یک پوشه'
                })
        
        # بررسی تداخل زمانی برای آزمون‌های زمان‌بندی شده
        if (self.test_type == TestType.SCHEDULED and 
            self.start_time and self.end_time and 
            self.start_time >= self.end_time):
            raise ValidationError({
                'end_time': 'زمان پایان باید بعد از زمان شروع باشد'
            })
    
    def save(self, *args, **kwargs):
        # Custom save to allow folder-based validation when only folders provided.
        # First, if object has no PK yet and only pending folders supplied (set by serializer) skip strict topic/knowledge_path check now.
        if self.pk:
            self.clean()
            return super().save(*args, **kwargs)
        try:
            pending_folders = getattr(self, '_pending_folders', None)
            if pending_folders and len(pending_folders) > 0 and self.test_type == TestType.TOPIC_BASED and not self.topic and not (self.knowledge_path and len(self.knowledge_path) > 0):
                # Temporarily bypass the clean check; we'll rely on serializer-level validation already ensuring at least one input.
                return super().save(*args, **kwargs)
            # Otherwise run normal validation
            self.clean()
            return super().save(*args, **kwargs)
        finally:
            if hasattr(self, '_pending_folders'):
                delattr(self, '_pending_folders')

    def __str__(self):
        if self.test_type == TestType.TOPIC_BASED and self.topic:
            return f"{self.name} - {self.topic.name}"
        elif self.test_collection:
            return f"{self.name} - {self.test_collection.name}"
        return self.name
    
    def is_topic_based(self):
        """آیا این آزمون مبحثی است؟"""
        return self.test_type == TestType.TOPIC_BASED
    
    def is_scheduled(self):
        """آیا این آزمون زمان‌بندی شده است؟"""
        return self.test_type == TestType.SCHEDULED
    
    def can_student_take_now(self, student=None):
        """آیا دانش‌آموز می‌تواند الان این آزمون را بدهد؟"""
        if self.test_type == TestType.TOPIC_BASED:
            # آزمون‌های مبحثی همیشه در دسترس هستند
            return True
        elif self.test_type == TestType.SCHEDULED:
            # بررسی زمان شروع و پایان
            from django.utils import timezone
            now = timezone.now()
            return (self.start_time and self.end_time and 
                    self.start_time <= now <= self.end_time)
        return False
    
    def get_display_status(self):
        """وضعیت نمایشی آزمون"""
        if self.test_type == TestType.TOPIC_BASED:
            return "آزاد - همیشه در دسترس"
        elif self.test_type == TestType.SCHEDULED:
            from django.utils import timezone
            now = timezone.now()
            if self.start_time and self.end_time:
                if now < self.start_time:
                    return f"شروع در {self.start_time.strftime('%Y/%m/%d %H:%M')}"
                elif now > self.end_time:
                    return "به پایان رسیده"
                else:
                    return "در حال برگزاری"
            return "زمان‌بندی نشده"
        return "نامشخص"

    def get_accessible_students(self):
        """دانش‌آموزانی که به این آزمون دسترسی دارند"""
        return self.test_collection.get_accessible_students()

    def get_participants_count(self):
        """تعداد شرکت‌کنندگان در آزمون"""
        return self.studenttestsession_set.values('user').distinct().count()

    def get_completed_count(self):
        """تعداد کسانی که آزمون را تکمیل کرده‌اند"""
        return self.studenttestsession_set.filter(status='completed').count()

    def get_total_questions(self):
        """محاسبه تعداد کل سوالات بر اساس پاسخ‌های موجود"""
        # اگر کلید سوالات موجود است، از آن استفاده کن
        primary_keys = self.primary_keys.all()
        if primary_keys.exists():
            # بیشترین شماره سوال را پیدا کن
            max_question = primary_keys.aggregate(
                max_question=models.Max('question_number')
            )['max_question']
            return max_question if max_question else 60
        
        # پیش‌فرض: 60 سوال
        return 60

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
        from django.utils import timezone
        
        if not self.entry_time:
            self.entry_time = timezone.now()
        
        if not self.end_time:
            # برای آزمون‌های مبحثی، زمان پایان بر اساس مدت زمان محاسبه می‌شود
            self.end_time = self.entry_time + self.test.duration
        
        super().save(*args, **kwargs)

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() >= self.end_time
    
    def can_continue(self):
        """آیا دانش‌آموز می‌تواند آزمون را ادامه دهد؟"""
        if self.status == 'completed':
            return False
        
        # برای آزمون‌های مبحثی، تا زمانی که expire نشده باشد قابل ادامه است
        if self.test.test_type == TestType.TOPIC_BASED:
            return not self.is_expired()
        
        # برای آزمون‌های زمان‌بندی شده، باید در بازه زمانی آزمون باشیم
        elif self.test.test_type == TestType.SCHEDULED:
            return self.test.can_student_take_now() and not self.is_expired()
        
        return False

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



class Question(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'ساده'),
        ('medium', 'متوسط'),
        ('hard', 'دشوار'),
    ]

    # شناسه عمومی شش‌کاراکتری با رقم کنترل (غیرقابل حدس)
    public_id = models.CharField(
        max_length=6, 
        unique=True, 
        default=generate_secure_question_id,
        verbose_name="شناسه عمومی",
        help_text="شناسه شش‌کاراکتری با رقم کنترل برای نمایش عمومی"
    )

    question_text = models.TextField(verbose_name="متن سوال")
    folders = models.ManyToManyField(Folder, blank=True, related_name='questions', verbose_name="پوشه‌ها")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ آخرین بروزرسانی")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="ایجاد شده توسط")
    publish_date = models.CharField(max_length=10, null=True, blank=True, default=None)
    source = models.CharField(max_length=100, null=True, blank=True, default=None)
    difficulty_level = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='medium',
        verbose_name="سطح دشواری"
    )
    
    detailed_solution = models.TextField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    # فیلد جدید برای پاسخ صحیح (اختیاری، اگر نیاز به ذخیره پاسخ صحیح داشته باشید)
    correct_option = models.ForeignKey(
        'Option',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='correct_for_questions',
        verbose_name="گزینه صحیح"
    )

    class Meta:
        verbose_name = "سوال"
        verbose_name_plural = "سوالات"

    class Meta:
        verbose_name = "سوال"
        verbose_name_plural = "سوالات"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['public_id']),
            models.Index(fields=['difficulty_level']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.public_id} - {self.question_text[:50]}"
    
    def get_folders_names(self):
        """برگرداندن لیست نام پوشه‌های سوال"""
        return [folder.name for folder in self.folders.all()]
    
    def validate_public_id(self):
        """اعتبارسنجی شناسه عمومی"""
        return validate_question_id(self.public_id)
    
    def save(self, *args, **kwargs):
        """ذخیره سوال با اعتبارسنجی ID"""
        if not self.public_id:
            self.public_id = generate_secure_question_id()
        
        # اطمینان از یکتا بودن public_id
        while Question.objects.filter(public_id=self.public_id).exclude(pk=self.pk).exists():
            self.public_id = generate_secure_question_id()
            
        super().save(*args, **kwargs)

class Option(models.Model):
    question = models.ForeignKey(
        Question, 
        on_delete=models.CASCADE, 
        related_name='options',
        verbose_name="سوال مرتبط"
    )
    option_text = models.CharField(max_length=500, verbose_name="متن گزینه")
    order = models.PositiveIntegerField(default=1, verbose_name="ترتیب گزینه")  # برای مرتب‌سازی گزینه‌ها
    option_image = models.ImageField(
        upload_to='options/', 
        null=True, 
        blank=True, 
        verbose_name="تصویر گزینه",
        validators=[]  # Remove default PIL validators to allow SVG
    )
    class Meta:
        verbose_name = "گزینه"
        verbose_name_plural = "گزینه‌ها"
        ordering = ['order']  # مرتب‌سازی بر اساس ترتیب

    def __str__(self):
        return f"{self.question.question_text[:30]} - {self.option_text[:30]}"


class QuestionImage(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="سوال مرتبط"
    )
    image = models.ImageField(
        upload_to='question_images/', 
        verbose_name="تصویر",
        validators=[]  # Remove default PIL validators to allow SVG
    )
    alt_text = models.CharField(max_length=255, blank=True, null=True, verbose_name="متن جایگزین")
    order = models.PositiveIntegerField(default=1, verbose_name="ترتیب تصویر")

    class Meta:
        verbose_name = "تصویر سوال"
        verbose_name_plural = "تصاویر سوال"
        ordering = ['order']

    def __str__(self):
        return f"تصویر برای {self.question.question_text[:30]}"


class DetailedSolutionImage(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='detailed_solution_images',
        verbose_name="سوال مرتبط"
    )
    image = models.ImageField(
        upload_to='detailed_solution_images/',
        verbose_name="تصویر پاسخ تشریحی",
        validators=[]  # Remove default PIL validators to allow SVG
    )
    alt_text = models.CharField(max_length=255, blank=True, null=True, verbose_name="متن جایگزین")
    order = models.PositiveIntegerField(default=1, verbose_name="ترتیب تصویر")

    class Meta:
        verbose_name = "تصویر پاسخ تشریحی"
        verbose_name_plural = "تصاویر پاسخ تشریحی"
        ordering = ['order']

    def __str__(self):
        return f"تصویر پاسخ تشریحی برای {self.question.question_text[:30]}"
 

class QuestionCollection(models.Model):
    """مجموعه سوالات برای مدیریت بهتر"""
    name = models.CharField(max_length=255, verbose_name="نام مجموعه سوال")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    questions = models.ManyToManyField(Question, related_name='collections', verbose_name="سوالات")
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_question_collections',
        limit_choices_to={"role": "teacher"},
        verbose_name="ایجاد شده توسط"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ آخرین بروزرسانی")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        verbose_name = "مجموعه سوال"
        verbose_name_plural = "مجموعه‌های سوال"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_total_questions(self):
        """تعداد کل سوالات در این مجموعه"""
        return self.questions.count()

