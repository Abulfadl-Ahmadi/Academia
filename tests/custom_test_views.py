from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Max, Min, Q
from django.utils import timezone

from .models import CustomTest, CustomTestStatus, Question, CustomTestAnswer
from .custom_test_serializers import (
    CustomTestCreateSerializer,
    CustomTestListSerializer,
    CustomTestDetailSerializer,
    CustomTestStartSerializer,
    CustomTestSubmitSerializer,
    CustomTestFinishSerializer,
    CustomTestStatsSerializer
)


class CustomTestViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت آزمون‌های شخصی‌سازی شده
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """فقط آزمون‌های خود دانش‌آموز"""
        return CustomTest.objects.filter(student=self.request.user).prefetch_related(
            'folders', 'questions'
        )
    
    def get_serializer_class(self):
        """انتخاب serializer بر اساس action"""
        if self.action == 'create':
            return CustomTestCreateSerializer
        elif self.action == 'retrieve':
            return CustomTestDetailSerializer
        elif self.action == 'start':
            return CustomTestStartSerializer
        elif self.action == 'submit_answer':
            return CustomTestSubmitSerializer
        elif self.action == 'finish':
            return CustomTestFinishSerializer
        elif self.action == 'stats':
            return CustomTestStatsSerializer
        return CustomTestListSerializer
    
    def create(self, request, *args, **kwargs):
        """ایجاد آزمون شخصی جدید"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        custom_test = serializer.save()
        
        # بازگشت با جزئیات کامل
        detail_serializer = CustomTestDetailSerializer(custom_test, context={'request': request})
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
    
    def list(self, request, *args, **kwargs):
        """لیست آزمون‌های شخصی با فیلترها"""
        queryset = self.get_queryset()
        
        # فیلتر بر اساس status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # مرتب‌سازی
        ordering = request.query_params.get('ordering', '-created_at')
        queryset = queryset.order_by(ordering)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        شروع آزمون
        POST /custom-tests/{id}/start/
        """
        custom_test = self.get_object()
        
        # بررسی وضعیت
        if custom_test.status != CustomTestStatus.NOT_STARTED:
            return Response(
                {'error': 'این آزمون قبلاً شروع شده است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(custom_test, data={})
        serializer.is_valid(raise_exception=True)
        custom_test = serializer.save()
        
        # بازگشت جزئیات کامل
        detail_serializer = CustomTestDetailSerializer(custom_test, context={'request': request})
        return Response(detail_serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """
        ثبت پاسخ سوال
        POST /custom-tests/{id}/submit_answer/
        Body: {"question_id": 1, "option_id": 2}
        """
        custom_test = self.get_object()
        
        # بررسی وضعیت
        if custom_test.status != CustomTestStatus.IN_PROGRESS:
            return Response(
                {'error': 'آزمون در حال انجام نیست'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # بررسی انقضا
        if custom_test.is_expired():
            custom_test.status = CustomTestStatus.EXPIRED
            custom_test.save()
            return Response(
                {'error': 'زمان آزمون به پایان رسیده است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(
            data=request.data,
            context={'custom_test': custom_test}
        )
        serializer.is_valid(raise_exception=True)
        answer = serializer.save()
        
        return Response({
            'success': True,
            'message': 'پاسخ با موفقیت ثبت شد',
            'question_id': answer.question.id,
            'selected_option_id': answer.selected_option.id
        })
    
    @action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        """
        پایان دادن به آزمون و محاسبه نمره
        POST /custom-tests/{id}/finish/
        """
        custom_test = self.get_object()
        
        serializer = self.get_serializer(custom_test, data={})
        serializer.is_valid(raise_exception=True)
        custom_test = serializer.save()
        
        return Response({
            'success': True,
            'message': 'آزمون با موفقیت پایان یافت',
            'score': float(custom_test.score) if custom_test.score else 0,
            'total_questions': custom_test.questions.count(),
        })
    
    @action(detail=True, methods=['get'])
    def answers(self, request, pk=None):
        """
        دریافت پاسخ‌های ثبت شده دانش‌آموز
        GET /custom-tests/{id}/answers/
        """
        custom_test = self.get_object()
        
        answers = custom_test.custom_answers.filter(
            student=custom_test.student
        ).select_related('question', 'selected_option')
        
        result = []
        for answer in answers:
            result.append({
                'question_id': answer.question.id,
                'selected_option_id': answer.selected_option.id,
                'is_correct': answer.is_correct()
            })
        
        return Response(result)
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """
        دریافت نتایج کامل آزمون (بعد از تکمیل)
        GET /custom-tests/{id}/results/
        """
        custom_test = self.get_object()
        
        if custom_test.status not in [CustomTestStatus.COMPLETED, CustomTestStatus.EXPIRED]:
            return Response(
                {'error': 'نتایج فقط برای آزمون‌های تکمیل شده در دسترس است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        questions = custom_test.questions.all().prefetch_related('options')
        answers = custom_test.custom_answers.filter(
            student=custom_test.student
        ).select_related('question', 'selected_option')
        
        # ساخت دیکشنری پاسخ‌ها
        answers_dict = {answer.question.id: answer for answer in answers}
        
        results = []
        correct_count = 0
        
        for question in questions:
            answer = answers_dict.get(question.id)
            is_correct = False
            
            if answer and answer.selected_option == question.correct_option:
                is_correct = True
                correct_count += 1
            
            results.append({
                'question_id': question.id,
                'public_id': question.public_id,
                'question_text': question.question_text,
                'difficulty_level': question.difficulty_level,
                'correct_option_id': question.correct_option.id if question.correct_option else None,
                'correct_option_text': question.correct_option.option_text if question.correct_option else None,
                'selected_option_id': answer.selected_option.id if answer else None,
                'selected_option_text': answer.selected_option.option_text if answer else None,
                'is_correct': is_correct,
                'detailed_solution': question.detailed_solution,
                'options': [
                    {
                        'id': option.id,
                        'option_text': option.option_text,
                        'order': option.order
                    }
                    for option in question.options.all().order_by('order')
                ]
            })
        
        return Response({
            'test_name': custom_test.name,
            'score': float(custom_test.score) if custom_test.score else 0,
            'correct_answers': correct_count,
            'total_questions': len(results),
            'questions': results,
            'started_at': custom_test.started_at,
            'completed_at': custom_test.completed_at,
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        دریافت آمار کلی آزمون‌های شخصی دانش‌آموز
        GET /custom-tests/stats/
        """
        queryset = self.get_queryset()
        
        total_tests = queryset.count()
        completed_tests = queryset.filter(status=CustomTestStatus.COMPLETED).count()
        in_progress_tests = queryset.filter(status=CustomTestStatus.IN_PROGRESS).count()
        
        # محاسبه آمار نمرات
        completed_queryset = queryset.filter(
            status=CustomTestStatus.COMPLETED,
            score__isnull=False
        )
        
        stats = completed_queryset.aggregate(
            average_score=Avg('score'),
            best_score=Max('score'),
            worst_score=Min('score')
        )
        
        # تعداد کل سوالات (از custom tests)
        total_questions_answered = 0
        for test in queryset.filter(status=CustomTestStatus.COMPLETED):
            # فقط آزمون‌های تکمیل شده را حساب می‌کنیم
            total_questions_answered += test.questions.count()
        
        data = {
            'total_tests': total_tests,
            'completed_tests': completed_tests,
            'in_progress_tests': in_progress_tests,
            'average_score': float(stats['average_score']) if stats['average_score'] else 0,
            'best_score': float(stats['best_score']) if stats['best_score'] else 0,
            'worst_score': float(stats['worst_score']) if stats['worst_score'] else 0,
            'total_questions_answered': total_questions_answered,
        }
        
        serializer = self.get_serializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def delete_completed(self, request):
        """
        حذف تمام آزمون‌های تکمیل شده
        DELETE /custom-tests/delete_completed/
        """
        deleted_count = self.get_queryset().filter(
            status=CustomTestStatus.COMPLETED
        ).delete()[0]
        
        return Response({
            'success': True,
            'message': f'{deleted_count} آزمون حذف شد'
        })
