from django.core.management.base import BaseCommand
from knowledge.models import Topic
from tests.models import Test, TestType
from contents.models import File
from accounts.models import User
from datetime import timedelta


class Command(BaseCommand):
    help = 'ایجاد نمونه آزمون‌های مبحثی'

    def handle(self, *args, **options):
        # پیدا کردن یک معلم
        teacher = User.objects.filter(role='teacher').first()
        if not teacher:
            # ایجاد یک معلم نمونه
            teacher = User.objects.create_user(
                username='teacher_sample',
                role='teacher',
                first_name='معلم',
                last_name='نمونه'
            )
            self.stdout.write(
                self.style.SUCCESS(f'معلم نمونه "{teacher}" ایجاد شد')
            )
        
        # پیدا کردن یک فایل PDF نمونه
        sample_file = File.objects.filter(content_type=File.ContentType.TEST).first()
        if not sample_file:
            self.stdout.write(
                self.style.WARNING('⚠️ هیچ فایل PDF نمونه‌ای یافت نشد. لطفاً ابتدا یک فایل PDF آپلود کنید.')
            )
            return
        
        # پیدا کردن مباحث موجود
        topics = Topic.objects.all()[:10]  # اولین 10 مبحث
        
        if not topics:
            self.stdout.write(
                self.style.ERROR('❌ هیچ مبحثی یافت نشد. ابتدا دستور create_sample_knowledge را اجرا کنید.')
            )
            return
        
        created_tests = 0
        
        for topic in topics:
            # برای هر مبحث 3-5 آزمون ایجاد می‌کنیم
            for i in range(1, 4):  # 3 آزمون برای هر مبحث
                test_name = f"آزمون {i} - {topic.name}"
                
                # بررسی آزمون تکراری
                if Test.objects.filter(name=test_name, topic=topic).exists():
                    continue
                
                # تعیین مدت زمان بر اساس سطح دشواری
                if topic.difficulty == 'beginner':
                    duration = timedelta(minutes=20)
                elif topic.difficulty == 'intermediate':
                    duration = timedelta(minutes=30)
                else:  # advanced یا expert
                    duration = timedelta(minutes=45)
                
                # ایجاد آزمون
                test = Test.objects.create(
                    name=test_name,
                    description=f"آزمون تمرینی برای موضوع {topic.name} در سطح {topic.get_difficulty_display()}",
                    teacher=teacher,
                    test_type=TestType.TOPIC_BASED,
                    topic=topic,
                    pdf_file=sample_file,
                    duration=duration,
                    is_active=True
                )
                
                created_tests += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ آزمون "{test.name}" ایجاد شد')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'🎉 مجموعاً {created_tests} آزمون مبحثی ایجاد شد!')
        )
        self.stdout.write(
            self.style.WARNING('💡 دانش‌آموزان اکنون می‌توانند از درخت دانش آزمون‌های تصادفی دریافت کنند')
        )
