from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Avg, Q
from django.utils import timezone

from .models import Subject, Chapter, Section, Lesson, TopicCategory, Topic, StudentTopicProgress, Folder
from .serializers import (
    SubjectSerializer, ChapterSerializer, SectionSerializer, LessonSerializer,
    TopicCategorySerializer, TopicSerializer, StudentTopicProgressSerializer,
    TopicTestRequestSerializer, KnowledgeTreeSerializer,
    TopicDetailSerializer, FolderSerializer
)
from tests.models import Test, StudentTestSession
from tests.serializers import TestDetailSerializer
from contents.models import File
from contents.serializers import FileSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    """ViewSet برای مشاهده کتاب‌های درسی"""
    queryset = Subject.objects.filter(is_active=True).prefetch_related(
        'chapters__sections__lessons__topic_categories__topics'
    )
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def book_files(self, request):
        """لیست فایل‌های کتاب برای انتخاب"""
        book_files = File.objects.filter(content_type='book')
        serializer = FileSerializer(book_files, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def knowledge_tree(self, request):
        """نمایش فشرده درخت دانش"""
        subjects = self.get_queryset()
        serializer = KnowledgeTreeSerializer(subjects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def student_progress(self, request, pk=None):
        """پیشرفت دانش‌آموز در یک کتاب"""
        subject = self.get_object()
        student = request.user
        
        # تمام مباحث این کتاب
        topics = Topic.objects.filter(topic_category__lesson__section__chapter__subject=subject)
        
        # پیشرفت‌های موجود
        progresses = StudentTopicProgress.objects.filter(
            student=student,
            topic__in=topics
        )
        
        # آمار کلی
        total_topics = topics.count()
        mastered_topics = progresses.filter(is_mastered=True).count()
        
        data = {
            'subject': SubjectSerializer(subject).data,
            'total_topics': total_topics,
            'mastered_topics': mastered_topics,
            'mastery_percentage': (mastered_topics / total_topics * 100) if total_topics > 0 else 0,
            'progresses': StudentTopicProgressSerializer(progresses, many=True).data
        }
        
        return Response(data)


class ChapterViewSet(viewsets.ModelViewSet):
    """ViewSet برای مشاهده فصل‌ها"""
    queryset = Chapter.objects.all().prefetch_related('sections__lessons__topic_categories__topics')
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticated]


class SectionViewSet(viewsets.ModelViewSet):
    """ViewSet برای مشاهده زیربخش‌ها"""
    queryset = Section.objects.all().prefetch_related('lessons__topic_categories__topics')
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]


class LessonViewSet(viewsets.ModelViewSet):
    """ViewSet برای مشاهده درس‌ها"""
    queryset = Lesson.objects.all().prefetch_related('topic_categories__topics')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]


class TopicCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet برای مشاهده دسته‌های موضوع"""
    queryset = TopicCategory.objects.all().prefetch_related('topics')
    serializer_class = TopicCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class TopicViewSet(viewsets.ModelViewSet):
    """ViewSet برای مشاهده مباحث"""
    queryset = Topic.objects.all().select_related(
        'topic_category__lesson__section__chapter__subject'
    ).prefetch_related('prerequisites')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TopicDetailSerializer
        return TopicSerializer
    
    @action(detail=True, methods=['get'])
    def available_tests(self, request, pk=None):
        """آزمون‌های موجود برای این مبحث"""
        topic = self.get_object()
        tests = topic.topic_tests.filter(is_active=True)
        serializer = TestDetailSerializer(tests, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def get_random_test(self, request, pk=None):
        """دریافت آزمون تصادفی از این مبحث"""
        topic = self.get_object()
        student = request.user
        
        # بررسی دسترسی دانش‌آموز
        if student.role != 'student':
            return Response(
                {'error': 'فقط دانش‌آموزان می‌توانند آزمون بگیرند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # انتخاب آزمون تصادفی
        random_test = topic.get_random_test()
        if not random_test:
            return Response(
                {'error': 'هیچ آزمونی برای این مبحث موجود نیست'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # بررسی اینکه آیا دانش‌آموز قبلاً در این آزمون شرکت کرده یا نه
        existing_session = StudentTestSession.objects.filter(
            user=student,
            test=random_test,
            status='active'
        ).first()
        
        if existing_session:
            return Response(
                {'error': 'شما در حال حاضر در این آزمون شرکت دارید'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'test': TestDetailSerializer(random_test).data,
            'topic': TopicDetailSerializer(topic).data,
            'message': 'آزمون با موفقیت انتخاب شد'
        })
    
    @action(detail=True, methods=['get'])
    def student_progress(self, request, pk=None):
        """پیشرفت دانش‌آموز در این مبحث"""
        topic = self.get_object()
        student = request.user
        
        progress, created = StudentTopicProgress.objects.get_or_create(
            student=student,
            topic=topic
        )
        
        if not created:
            # به‌روزرسانی پیشرفت
            progress.update_progress()
        
        serializer = StudentTopicProgressSerializer(progress)
        return Response(serializer.data)


class StudentTopicProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet برای مشاهده پیشرفت‌های دانش‌آموز"""
    serializer_class = StudentTopicProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'student':
            return StudentTopicProgress.objects.filter(
                student=self.request.user
            ).select_related('topic__topic_category__lesson__section__chapter__subject')
        elif self.request.user.role in ['teacher', 'admin']:
            return StudentTopicProgress.objects.all().select_related(
                'student', 'topic__topic_category__lesson__section__chapter__subject'
            )
        return StudentTopicProgress.objects.none()
    
    @action(detail=False, methods=['get'])
    def my_statistics(self, request):
        """آمار کلی پیشرفت دانش‌آموز"""
        if request.user.role != 'student':
            return Response(
                {'error': 'فقط دانش‌آموزان دسترسی دارند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        progresses = self.get_queryset()
        
        # محاسبه آمار
        total_topics_studied = progresses.count()
        mastered_topics = progresses.filter(is_mastered=True).count()
        total_tests_taken = progresses.aggregate(
            total=Count('tests_taken')
        )['total'] or 0
        
        average_skill = progresses.aggregate(
            avg=Avg('skill_level')
        )['avg'] or 0
        
        # تحلیل بر اساس سطح دشواری
        difficulty_stats = {}
        for difficulty in ['beginner', 'intermediate', 'advanced', 'expert']:
            diff_progresses = progresses.filter(topic__difficulty=difficulty)
            difficulty_stats[difficulty] = {
                'total': diff_progresses.count(),
                'mastered': diff_progresses.filter(is_mastered=True).count(),
                'avg_skill': diff_progresses.aggregate(
                    avg=Avg('skill_level')
                )['avg'] or 0
            }
        
        data = {
            'total_topics_studied': total_topics_studied,
            'mastered_topics': mastered_topics,
            'mastery_percentage': (mastered_topics / total_topics_studied * 100) if total_topics_studied > 0 else 0,
            'total_tests_taken': total_tests_taken,
            'average_skill_level': round(average_skill, 2),
            'difficulty_breakdown': difficulty_stats,
            'recent_activities': StudentTopicProgressSerializer(
                progresses.order_by('-last_attempt')[:10], many=True
            ).data
        }
        
        return Response(data)


class FolderViewSet(viewsets.ModelViewSet):
    """CRUD برای پوشه‌های سلسله مراتبی جدید"""
    queryset = Folder.objects.all().prefetch_related('children')
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['parent']
    search_fields = ['name']
    ordering_fields = ['order', 'name']

    @action(detail=False, methods=['get'])
    def tree(self, request):
        roots = Folder.objects.filter(parent__isnull=True).order_by('order', 'id')
        data = FolderSerializer(roots, many=True).data
        return Response(data)

    @action(detail=False, methods=['get'])
    def question_statistics(self, request):
        """آمار کلی سوالات و سوالات بدون پوشه"""
        from tests.models import Question
        
        # تعداد کل سوالات فعال
        total_questions = Question.objects.filter(is_active=True).count()
        
        # تعداد سوالاتی که هیچ پوشه‌ای ندارند
        questions_without_folders = Question.objects.filter(
            is_active=True,
            folders__isnull=True
        ).count()
        
        # تعداد سوالاتی که حداقل یک پوشه دارند
        questions_with_folders = total_questions - questions_without_folders
        
        return Response({
            'total_questions': total_questions,
            'questions_without_folders': questions_without_folders,
            'questions_with_folders': questions_with_folders,
            'percentage_without_folders': round(
                (questions_without_folders / total_questions * 100) if total_questions > 0 else 0, 2
            )
        })

    @action(detail=False, methods=['post'])
    def merge_folders(self, request):
        """ادغام سوالات از پوشه مبدا و تمام زیرپوشه‌هایش به پوشه مقصد همراه با کپی ساختار"""
        source_folder_id = request.data.get('source_folder_id')
        destination_folder_id = request.data.get('destination_folder_id')
        
        if not source_folder_id or not destination_folder_id:
            return Response(
                {'error': 'شناسه پوشه مبدا و مقصد الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if source_folder_id == destination_folder_id:
            return Response(
                {'error': 'پوشه مبدا و مقصد نمی‌توانند یکسان باشند'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            source_folder = Folder.objects.get(id=source_folder_id)
            destination_folder = Folder.objects.get(id=destination_folder_id)
        except Folder.DoesNotExist:
            return Response(
                {'error': 'یکی از پوشه‌ها پیدا نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from tests.models import Question
        
        # تابع برای کپی کردن ساختار پوشه‌ها
        def copy_folder_structure(source, destination_parent, folder_mapping=None):
            """کپی کردن ساختار پوشه به صورت بازگشتی"""
            if folder_mapping is None:
                folder_mapping = {}
            
            # کپی کردن زیرپوشه‌های مستقیم
            children = Folder.objects.filter(parent=source)
            for child in children:
                # بررسی اینکه آیا این پوشه قبلاً در مقصد وجود دارد
                existing_folder = Folder.objects.filter(
                    parent=destination_parent,
                    name=child.name
                ).first()
                
                if existing_folder:
                    # اگر پوشه‌ای با همین نام وجود دارد، از همان استفاده کن
                    new_folder = existing_folder
                else:
                    # ایجاد پوشه جدید
                    new_folder = Folder.objects.create(
                        name=child.name,
                        parent=destination_parent,
                        order=child.order
                    )
                
                folder_mapping[child.id] = new_folder
                
                # به صورت بازگشتی کپی کردن زیرپوشه‌ها
                copy_folder_structure(child, new_folder, folder_mapping)
            
            return folder_mapping
        
        # کپی کردن ساختار زیرپوشه‌ها به مقصد
        folder_mapping = copy_folder_structure(source_folder, destination_folder)
        
        # پیدا کردن تمام زیرپوشه‌های پوشه مبدا
        def get_all_subfolders(folder):
            """بازگرداندن تمام زیرپوشه‌های یک پوشه به صورت بازگشتی"""
            subfolders = [folder]
            children = Folder.objects.filter(parent=folder)
            for child in children:
                subfolders.extend(get_all_subfolders(child))
            return subfolders
        
        all_source_folders = get_all_subfolders(source_folder)
        
        # پیدا کردن تمام سوالاتی که در پوشه مبدا یا زیرپوشه‌هایش هستند
        questions_in_source = Question.objects.filter(
            folders__in=all_source_folders,
            is_active=True
        ).distinct()
        
        questions_count = questions_in_source.count()
        
        if questions_count == 0:
            return Response(
                {'message': 'هیچ سوالی در پوشه مبدا و زیرپوشه‌هایش موجود نیست'},
                status=status.HTTP_200_OK
            )
        
        # انتقال سوالات
        for question in questions_in_source:
            # اضافه کردن پوشه مقصد اصلی
            question.folders.add(destination_folder)
            
            # برای هر سوال، بررسی اینکه در کدام پوشه‌های مبدا بوده و آن‌ها را به پوشه‌های متناظر در مقصد اضافه کردن
            question_folders = question.folders.filter(id__in=[f.id for f in all_source_folders])
            for folder in question_folders:
                if folder.id != source_folder.id and folder.id in folder_mapping:
                    # اضافه کردن به پوشه متناظر در مقصد
                    question.folders.add(folder_mapping[folder.id])
        
        # حذف تمام پوشه‌های مبدا از سوالات
        for question in questions_in_source:
            for folder in all_source_folders:
                question.folders.remove(folder)
        
        return Response({
            'message': f'{questions_count} سوال از پوشه "{source_folder.name}" و {len(all_source_folders)-1} زیرپوشه‌اش به پوشه "{destination_folder.name}" منتقل شد و ساختار زیرپوشه‌ها کپی شد',
            'questions_moved': questions_count,
            'folders_affected': len(all_source_folders),
            'folders_copied': len(folder_mapping),
            'source_folder_name': source_folder.name,
            'destination_folder_name': destination_folder.name
        })


class KnowledgeTreeView(APIView):
    """View برای نمایش کامل درخت دانش"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        subjects = Subject.objects.filter(is_active=True).prefetch_related(
            'chapters__sections__lessons__topic_categories__topics'
        )
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)


class TopicRandomTestView(APIView):
    """View برای دریافت آزمون تصادفی از مبحث"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = TopicTestRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        topic_id = serializer.validated_data['topic_id']
        topic = get_object_or_404(Topic, id=topic_id)
        student = request.user
        
        # بررسی نقش کاربر
        if student.role != 'student':
            return Response(
                {'error': 'فقط دانش‌آموزان می‌توانند آزمون بگیرند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # انتخاب آزمون تصادفی
        random_test = topic.get_random_test()
        if not random_test:
            return Response(
                {'error': 'هیچ آزمونی برای این مبحث موجود نیست'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'test_id': random_test.id,
            'test_name': random_test.name,
            'topic': TopicDetailSerializer(topic).data,
            'duration': str(random_test.duration),
            'message': 'آزمون با موفقیت انتخاب شد'
        })
