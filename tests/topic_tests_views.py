from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from .models import Test, StudentTestSession, TestType
from knowledge.models import Topic, StudentTopicProgress
from .serializers import (
    TopicTestCreateSerializer, TopicTestDetailSerializer, 
    StartTopicTestSerializer, TestDetailSerializer
)


class TopicTestViewSet(viewsets.ModelViewSet):
    """ViewSet برای مدیریت آزمون‌های مبحثی"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Test.objects.filter(test_type=TestType.TOPIC_BASED)
        
        # فیلترینگ بر اساس نقش کاربر
        if self.request.user.role == 'student':
            # دانش‌آموزان فقط آزمون‌های فعال را می‌بینند
            queryset = queryset.filter(is_active=True)
        elif self.request.user.role == 'teacher':
            # معلم‌ها فقط آزمون‌های خودشان را می‌بینند
            queryset = queryset.filter(teacher=self.request.user)
        # ادمین همه آزمون‌ها را می‌بیند
        
        return queryset.select_related('topic__topic_category__lesson__section__chapter__subject')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TopicTestCreateSerializer
        elif self.action in ['retrieve', 'list']:
            return TopicTestDetailSerializer
        return TopicTestDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_test(self, request, pk=None):
        """شروع آزمون مبحثی"""
        test = self.get_object()
        student = request.user
        
        # بررسی نقش کاربر
        if student.role != 'student':
            return Response(
                {'error': 'فقط دانش‌آموزان می‌توانند آزمون بدهند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # بررسی فعال بودن آزمون
        if not test.is_active:
            return Response(
                {'error': 'این آزمون غیرفعال است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # بررسی آزمون مبحثی بودن
        if not test.is_topic_based():
            return Response(
                {'error': 'این آزمون مبحثی نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # بررسی جلسه فعال قبلی
        existing_session = StudentTestSession.objects.filter(
            user=student,
            test=test,
            status='active'
        ).first()
        
        if existing_session:
            if existing_session.can_continue():
                return Response({
                    'session_id': existing_session.id,
                    'message': 'شما قبلاً این آزمون را شروع کرده‌اید',
                    'remaining_time': (existing_session.end_time - timezone.now()).total_seconds(),
                    'can_continue': True
                })
            else:
                # جلسه منقضی شده
                existing_session.status = 'expired'
                existing_session.save()
        
        # ایجاد جلسه جدید
        serializer = StartTopicTestSerializer(data=request.data)
        if serializer.is_valid():
            device_id = serializer.validated_data.get('device_id', '')
            
            session = StudentTestSession.objects.create(
                user=student,
                test=test,
                device_id=device_id,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'session_id': session.id,
                'test_id': test.id,
                'test_name': test.name,
                'topic_name': test.topic.name if test.topic else '',
                'duration_minutes': int(test.duration.total_seconds() / 60),
                'total_questions': test.get_total_questions(),
                'start_time': session.entry_time,
                'end_time': session.end_time,
                'message': 'آزمون با موفقیت شروع شد'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_topic(self, request):
        """آزمون‌های مربوط به یک مبحث خاص"""
        topic_id = request.query_params.get('topic_id')
        if not topic_id:
            return Response(
                {'error': 'topic_id الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            topic = Topic.objects.get(id=topic_id)
        except Topic.DoesNotExist:
            return Response(
                {'error': 'مبحث یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        tests = self.get_queryset().filter(topic=topic)
        serializer = self.get_serializer(tests, many=True)
        
        return Response({
            'topic': {
                'id': topic.id,
                'name': topic.name,
                'difficulty': topic.difficulty
            },
            'tests': serializer.data,
            'total_tests': tests.count()
        })
    
    @action(detail=False, methods=['get'])
    def available_for_student(self, request):
        """آزمون‌های در دسترس دانش‌آموز"""
        if request.user.role != 'student':
            return Response(
                {'error': 'فقط دانش‌آموزان دسترسی دارند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # آزمون‌های فعال مبحثی
        tests = self.get_queryset().filter(is_active=True)
        
        # گروه‌بندی بر اساس مبحث
        tests_by_topic = {}
        for test in tests:
            if test.topic:
                topic_key = f"{test.topic.id}"
                if topic_key not in tests_by_topic:
                    tests_by_topic[topic_key] = {
                        'topic': {
                            'id': test.topic.id,
                            'name': test.topic.name,
                            'topic_category': test.topic.topic_category.name if test.topic.topic_category else 'نامشخص',
                            'lesson': test.topic.topic_category.lesson.name if test.topic.topic_category else 'نامشخص',
                            'section': test.topic.topic_category.lesson.section.name if test.topic.topic_category else 'نامشخص',
                            'chapter': test.topic.topic_category.lesson.section.chapter.name if test.topic.topic_category else 'نامشخص',
                            'subject': test.topic.topic_category.lesson.section.chapter.subject.name if test.topic.topic_category else 'نامشخص',
                            'difficulty': test.topic.difficulty
                        },
                        'tests': []
                    }
                
                tests_by_topic[topic_key]['tests'].append({
                    'id': test.id,
                    'name': test.name,
                    'description': test.description,
                    'duration_minutes': int(test.duration.total_seconds() / 60),
                    'total_questions': test.get_total_questions()
                })
        
        return Response({
            'topics_with_tests': list(tests_by_topic.values()),
            'total_topics': len(tests_by_topic),
            'total_tests': tests.count()
        })


class RandomTopicTestView(APIView):
    """دریافت آزمون تصادفی از یک مبحث"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        topic_id = request.data.get('topic_id')
        if not topic_id:
            return Response(
                {'error': 'topic_id الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            topic = get_object_or_404(Topic, id=topic_id)
        except Topic.DoesNotExist:
            return Response(
                {'error': 'مبحث یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # انتخاب آزمون تصادفی از آزمون‌های مبحثی فعال
        available_tests = Test.objects.filter(
            topic=topic,
            test_type=TestType.TOPIC_BASED,
            is_active=True
        )
        
        if not available_tests.exists():
            return Response(
                {'error': 'هیچ آزمون فعالی برای این مبحث وجود ندارد'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # انتخاب تصادفی
        import random
        random_test = random.choice(list(available_tests))
        
        serializer = TopicTestDetailSerializer(random_test)
        return Response({
            'test': serializer.data,
            'topic': {
                'id': topic.id,
                'name': topic.name,
                'difficulty': topic.difficulty
            },
            'message': 'آزمون تصادفی انتخاب شد'
        })


class StudentTopicTestHistoryView(APIView):
    """تاریخچه آزمون‌های مبحثی دانش‌آموز"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'فقط دانش‌آموزان دسترسی دارند'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # تمام جلسات آزمون‌های مبحثی این دانش‌آموز
        sessions = StudentTestSession.objects.filter(
            user=request.user,
            test__test_type=TestType.TOPIC_BASED
        ).select_related('test__topic__topic_category__lesson__section__chapter__subject').order_by('-entry_time')
        
        # گروه‌بندی بر اساس مبحث
        history_by_topic = {}
        
        for session in sessions:
            if session.test.topic:
                topic_key = f"{session.test.topic.id}"
                if topic_key not in history_by_topic:
                    history_by_topic[topic_key] = {
                        'topic': {
                            'id': session.test.topic.id,
                            'name': session.test.topic.name,
                            'difficulty': session.test.topic.difficulty
                        },
                        'sessions': [],
                        'total_attempts': 0,
                        'completed_attempts': 0,
                        'best_score': 0
                    }
                
                # محاسبه نمره
                score = 0
                if session.status == 'completed':
                    correct_answers = 0
                    total_questions = session.test.get_total_questions()
                    for answer in session.answers.all():
                        primary_key = session.test.primary_keys.filter(
                            question_number=answer.question_number
                        ).first()
                        if primary_key and primary_key.answer == answer.answer:
                            correct_answers += 1
                    
                    if total_questions > 0:
                        score = round((correct_answers / total_questions) * 100, 2)
                
                history_by_topic[topic_key]['sessions'].append({
                    'session_id': session.id,
                    'test_name': session.test.name,
                    'status': session.status,
                    'entry_time': session.entry_time,
                    'exit_time': session.exit_time,
                    'score': score
                })
                
                history_by_topic[topic_key]['total_attempts'] += 1
                if session.status == 'completed':
                    history_by_topic[topic_key]['completed_attempts'] += 1
                    if score > history_by_topic[topic_key]['best_score']:
                        history_by_topic[topic_key]['best_score'] = score
        
        return Response({
            'topic_history': list(history_by_topic.values()),
            'total_topics_attempted': len(history_by_topic),
            'total_sessions': sessions.count()
        })
