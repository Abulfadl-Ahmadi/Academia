from django.core.management.base import BaseCommand
from knowledge.models import Subject, Chapter, Section, Topic


class Command(BaseCommand):
    help = 'ایجاد نمونه داده برای درخت دانش'

    def handle(self, *args, **options):
        # ایجاد کتاب هندسه دهم
        geometry_10, created = Subject.objects.get_or_create(
            name="هندسه",
            grade=10,
            defaults={
                'description': 'کتاب هندسه پایه دهم - هندسه مسطحه و تحلیلی'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'کتاب "{geometry_10}" ایجاد شد')
            )
        
        # فصل اول: مبانی هندسه
        chapter1, _ = Chapter.objects.get_or_create(
            subject=geometry_10,
            order=1,
            defaults={
                'name': 'مبانی هندسه',
                'description': 'نقطه، خط، صفحه و روابط بین آنها'
            }
        )
        
        # زیربخش‌های فصل اول
        section1_1, _ = Section.objects.get_or_create(
            chapter=chapter1,
            order=1,
            defaults={
                'name': 'مفاهیم پایه',
                'description': 'تعریف نقطه، خط و صفحه'
            }
        )
        
        section1_2, _ = Section.objects.get_or_create(
            chapter=chapter1,
            order=2,
            defaults={
                'name': 'روابط هندسی',
                'description': 'موازی بودن، عمود بودن و تقاطع'
            }
        )
        
        # مباحث زیربخش اول
        topics_1_1 = [
            ('تعریف نقطه و خط', 'مفاهیم بنیادی نقطه و خط در هندسه'),
            ('انواع خطوط', 'خط راست، منحنی، پاره خط و پرتو'),
            ('صفحه و خصوصیات آن', 'تعریف صفحه و روابط نقطه و خط با صفحه'),
        ]
        
        for i, (name, desc) in enumerate(topics_1_1, 1):
            Topic.objects.get_or_create(
                section=section1_1,
                order=i,
                defaults={
                    'name': name,
                    'description': desc,
                    'difficulty': 'beginner',
                    'estimated_study_time': 25,
                    'tags': 'مبانی,هندسه,پایه'
                }
            )
        
        # مباحث زیربخش دوم
        topics_1_2 = [
            ('خطوط موازی', 'تعریف و خصوصیات خطوط موازی'),
            ('خطوط متقاطع', 'نقطه تقاطع و زاویه بین خطوط'),
            ('خطوط عمود', 'عمود بودن و زاویه قائمه'),
        ]
        
        for i, (name, desc) in enumerate(topics_1_2, 1):
            Topic.objects.get_or_create(
                section=section1_2,
                order=i,
                defaults={
                    'name': name,
                    'description': desc,
                    'difficulty': 'intermediate',
                    'estimated_study_time': 30,
                    'tags': 'موازی,عمود,تقاطع'
                }
            )
        
        # فصل دوم: هندسه مسطحه
        chapter2, _ = Chapter.objects.get_or_create(
            subject=geometry_10,
            order=2,
            defaults={
                'name': 'هندسه مسطحه',
                'description': 'مثلث‌ها، چهارضلعی‌ها و دایره'
            }
        )
        
        # زیربخش‌های فصل دوم
        section2_1, _ = Section.objects.get_or_create(
            chapter=chapter2,
            order=1,
            defaults={
                'name': 'مثلث‌ها',
                'description': 'انواع مثلث و قضایای مربوط به آن'
            }
        )
        
        section2_2, _ = Section.objects.get_or_create(
            chapter=chapter2,
            order=2,
            defaults={
                'name': 'قضایای مثلث',
                'description': 'قضیه تالس، فیثاغورث و سینوس‌ها'
            }
        )
        
        # مباحث قضایای مثلث
        topics_2_2 = [
            ('قضیه تالس', 'نسبت اضلاع در مثلث‌های متشابه'),
            ('قضیه فیثاغورث', 'رابطه بین اضلاع مثلث قائم‌الزاویه'),
            ('قضیه سینوس‌ها', 'رابطه بین اضلاع و زوایای مثلث'),
            ('قضیه کسینوس‌ها', 'رابطه جایگزین برای مثلث‌های غیرقائم'),
        ]
        
        for i, (name, desc) in enumerate(topics_2_2, 1):
            Topic.objects.get_or_create(
                section=section2_2,
                order=i,
                defaults={
                    'name': name,
                    'description': desc,
                    'difficulty': 'advanced',
                    'estimated_study_time': 45,
                    'tags': 'قضیه,مثلث,نسبت'
                }
            )
        
        # ایجاد کتاب حسابان
        calculus_11, created = Subject.objects.get_or_create(
            name="حسابان و هندسه تحلیلی",
            grade=11,
            defaults={
                'description': 'کتاب حسابان یازدهم - مشتق، انتگرال و هندسه تحلیلی'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'کتاب "{calculus_11}" ایجاد شد')
            )
        
        # فصل اول حسابان: حد و پیوستگی
        calc_chapter1, _ = Chapter.objects.get_or_create(
            subject=calculus_11,
            order=1,
            defaults={
                'name': 'حد و پیوستگی',
                'description': 'مفهوم حد تابع و پیوستگی'
            }
        )
        
        # زیربخش حد
        calc_section1_1, _ = Section.objects.get_or_create(
            chapter=calc_chapter1,
            order=1,
            defaults={
                'name': 'مفهوم حد',
                'description': 'تعریف و محاسبه حد تابع'
            }
        )
        
        # مباحث حد
        limit_topics = [
            ('تعریف حد', 'مفهوم حد تابع در یک نقطه'),
            ('قوانین حد', 'قوانین محاسبه حد مجموع، ضرب و تقسیم'),
            ('حد در بی‌نهایت', 'رفتار تابع در بی‌نهایت'),
            ('حدهای مهم', 'حدهای مثلثاتی و نمایی مهم'),
        ]
        
        for i, (name, desc) in enumerate(limit_topics, 1):
            Topic.objects.get_or_create(
                section=calc_section1_1,
                order=i,
                defaults={
                    'name': name,
                    'description': desc,
                    'difficulty': 'intermediate',
                    'estimated_study_time': 40,
                    'tags': 'حد,تابع,بی‌نهایت'
                }
            )
        
        # فصل دوم: مشتق
        calc_chapter2, _ = Chapter.objects.get_or_create(
            subject=calculus_11,
            order=2,
            defaults={
                'name': 'مشتق',
                'description': 'تعریف و کاربردهای مشتق'
            }
        )
        
        calc_section2_1, _ = Section.objects.get_or_create(
            chapter=calc_chapter2,
            order=1,
            defaults={
                'name': 'مفهوم مشتق',
                'description': 'تعریف مشتق و تفسیر هندسی آن'
            }
        )
        
        # مباحث مشتق
        derivative_topics = [
            ('تعریف مشتق', 'مشتق به عنوان حد نسبت تفاضل'),
            ('قوانین مشتق‌گیری', 'مشتق مجموع، ضرب و قسمت'),
            ('مشتق توابع مرکب', 'قانون زنجیره‌ای'),
            ('مشتق توابع مثلثاتی', 'مشتق سینوس، کسینوس و تانژانت'),
        ]
        
        for i, (name, desc) in enumerate(derivative_topics, 1):
            Topic.objects.get_or_create(
                section=calc_section2_1,
                order=i,
                defaults={
                    'name': name,
                    'description': desc,
                    'difficulty': 'advanced',
                    'estimated_study_time': 50,
                    'tags': 'مشتق,قانون,تابع'
                }
            )
        
        self.stdout.write(
            self.style.SUCCESS('✅ نمونه داده‌های درخت دانش با موفقیت ایجاد شدند!')
        )
        self.stdout.write(
            self.style.WARNING('💡 اکنون می‌توانید از پنل ادمین آزمون‌هایی به این مباحث اختصاص دهید')
        )
