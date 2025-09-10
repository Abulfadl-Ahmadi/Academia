from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Avg, Q
from django.utils import timezone

from .models import Subject, Chapter, Section, Topic, StudentTopicProgress
from .serializers import (
    SubjectSerializer, ChapterSerializer, SectionSerializer, 
    TopicSerializer, StudentTopicProgressSerializer,
    TopicTestRequestSerializer, KnowledgeTreeSerializer,
    TopicDetailSerializer
)
from tests.models import Test, StudentTestSession
from tests.serializers import TestDetailSerializer
from contents.models import File
from contents.serializers import FileSerializer


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet برای مشاهده کتاب‌های درسی"""
    queryset = Subject.objects.filter(is_active=True).prefetch_related(
        'chapters__sections__topics'
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
        topics = Topic.objects.filter(section__chapter__subject=subject)
        
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


class ChapterViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet برای مشاهده فصل‌ها"""
    queryset = Chapter.objects.all().prefetch_related('sections__topics')
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticated]


class SectionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet برای مشاهده زیربخش‌ها"""
    queryset = Section.objects.all().prefetch_related('topics')
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]


class TopicViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet برای مشاهده مباحث"""
    queryset = Topic.objects.all().select_related(
        'section__chapter__subject'
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
            ).select_related('topic__section__chapter__subject')
        elif self.request.user.role in ['teacher', 'admin']:
            return StudentTopicProgress.objects.all().select_related(
                'student', 'topic__section__chapter__subject'
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


class KnowledgeTreeView(APIView):
    """View برای نمایش کامل درخت دانش"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        subjects = Subject.objects.filter(is_active=True).prefetch_related(
            'chapters__sections__topics'
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
