from rest_framework import generics, status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction
from django.db.models import Avg
from django.http import HttpResponse, Http404
from django.core.exceptions import PermissionDenied
from .models import (
    Test, StudentTestSession, StudentAnswer, PrimaryKey, 
    StudentTestSessionLog, TestCollection, StudentProgress, Question, Option, QuestionImage
)
from .serializers import (
    TestCreateSerializer, TestUpdateSerializer, TestDetailSerializer,
    TestCollectionSerializer, TestCollectionDetailSerializer, StudentProgressSerializer,
    QuestionSerializer, QuestionCreateSerializer, OptionSerializer, QuestionImageSerializer
)
from rest_framework.exceptions import ValidationError
import pytz
import json



class ListCreateTestView(generics.ListCreateAPIView):
    serializer_class = TestCreateSerializer
    permission_classes = [IsAuthenticated]  # Only teachers in practice
    # queryset = Test.objects.all()

    def get_queryset(self):
        user = self.request.user

        if user.role == "student":
            # دانش‌آموزان فقط آزمون‌های مجموعه‌های قابل دسترس را می‌بینند
            accessible_collections = []
            for collection in TestCollection.objects.filter(is_active=True):
                if user in collection.get_accessible_students():
                    accessible_collections.append(collection.id)
            return Test.objects.filter(test_collection__id__in=accessible_collections)

        elif user.role == "teacher":
            # teacher should only see tests they created
            return Test.objects.filter(teacher=user)

        # fallback (e.g. admin)
        return Test.objects.all()



class TestDetailView(generics.RetrieveAPIView):
    queryset = Test.objects.all()
    serializer_class = TestDetailSerializer
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        test = self.get_object()

        # آیا کاربر یک سشن فعال دارد؟
        # has_active_session = StudentTestSession.objects.filter(
        #     user=request.user,
        #     test=test,
        #     status='active'
        # ).exists()

        # if not has_active_session:
        #     return Response(
        #         {"error": "You do not have an active session for this test."},
        #         status=403
        #     )

        # اگر سشن فعال وجود دارد → جزئیات آزمون را بده
        serializer = self.get_serializer(test)
        return Response(serializer.data)



class UpdateDeleteTestView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Test.objects.all()
    serializer_class = TestUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "teacher":
            # فقط آزمون‌هایی که این معلم ساخته
            return Test.objects.filter(teacher=user)
        # ادمین همه آزمون‌ها را می‌بیند
        return Test.objects.all()

    def perform_destroy(self, instance):
        # اطمینان از اینکه فقط معلم سازنده می‌تواند حذف کند
        user = self.request.user
        if user.role == "teacher" and instance.teacher != user:
            raise PermissionDenied("شما فقط می‌توانید آزمون‌های خود را حذف کنید")
        instance.delete()

class EnterTestView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

    def post(self, request, *args, **kwargs):
        test_id = request.data.get("test_id")
        device_id = request.data.get("device_id")
        user = request.user

        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            return Response({"error": "Test not found"}, status=404)
            
        # Check if user has already completed this test
        # Check if user has already completed this test
        completed_session = StudentTestSession.objects.filter(
            user=user, 
            test=test,
            status='completed'
        ).exists()
        
        if completed_session:
            return Response({
                "error": "completed", 
                "message": "شما قبلا این آزمون را به اتمام رسانده‌اید.",
                "redirect_to": f"/panel/tests/result/{test_id}/"
            }, status=403)

        now = timezone.now()
        if now < test.start_time or now > test.end_time:
            return Response({"error": "You are not allowed to enter at this time."}, status=403)

        session, created = StudentTestSession.objects.get_or_create(
            user=user, test=test,
            defaults={
                "device_id": device_id,
                "ip_address": self.get_client_ip(request),
                "user_agent": request.META.get('HTTP_USER_AGENT', ''),
                "status": "active",
            }
        )

        # اگر سشن از قبل هست ولی مدت زمانش تمام شده
        if session.is_expired():
            session.status = 'expired'
            session.save()
            return Response({"detail": "زمان آزمون شما به پایان رسیده است."}, status=403)

        # اگر دستگاه متفاوت است و دانش‌آموز از قبل وارد شده بوده ولی سشن غیرفعال نیست
        if not created and session.status == "active" and session.device_id != device_id:
            return Response({"error": "You are already logged in from another device."}, status=403)

        # اگر قبلاً خارج شده بوده، دوباره فعالش می‌کنیم
        if session.status == "inactive":
            session.device_id = device_id
            session.ip_address = self.get_client_ip(request)
            session.user_agent = request.META.get('HTTP_USER_AGENT', '')
            session.status = "active"
            session.save()

        # ثبت لاگ ورود
        StudentTestSessionLog.objects.create(
            session=session,
            action='login',
            device_id=device_id,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        pdf_url = test.pdf_file.file.url if test.pdf_file and test.pdf_file.file else None

        return Response({
            "session_id": session.id,
            "test_id": test.id,
            "pdf_file_url": request.build_absolute_uri(pdf_url) if pdf_url else None,
            "duration_minutes": int(test.duration.total_seconds() / 60),
            "entry_time": session.entry_time.isoformat(),
            "end_time": session.end_time.isoformat()
        }, status=201)


class SubmitAnswerView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        session_id = request.data.get("session_id")
        answers = request.data.get("answers")  # list of dicts: [{"question_number": 1, "answer": 2}, ...]
        
        # Support for single answer format
        question_number = request.data.get("question_number")
        answer = request.data.get("answer")
        
        user = request.user

        try:
            session = StudentTestSession.objects.get(id=session_id, user=user)
        except StudentTestSession.DoesNotExist:
            raise ValidationError("Session not found.")

        now = timezone.now()
        if now > session.entry_time + session.test.duration:
            return Response({"error": "Time is up."}, status=403)
        if session.status == "completed":
            return Response({"error": "You've submitted your answer sheet and you can no longer modify it."}, status=403)

        # Handle single answer format (question_number and answer directly in payload)
        if question_number is not None and answer is not None and answers is None:
            try:
                question_number = int(question_number)
                answer = int(answer) if answer != "" else None
            except (ValueError, TypeError):
                return Response({"error": "question_number and answer must be integers"}, status=status.HTTP_400_BAD_REQUEST)
                
            StudentAnswer.objects.update_or_create(
                session=session,
                question_number=question_number,
                defaults={"answer": answer}
            )
            return Response({"message": "Answer submitted."})

        # Handle multiple answers format
        if isinstance(answers, str):
            try:
                answers = json.loads(answers)
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON in answers"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if answers is None or empty
        if answers is None:
            return Response({"error": "Either 'answers' array or 'question_number' and 'answer' are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not isinstance(answers, list):
            return Response({"error": "Answers must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        for a in answers:
            # Validate answer format
            if not isinstance(a, dict):
                return Response({"error": "Each answer must be a dictionary"}, status=status.HTTP_400_BAD_REQUEST)
            
            if "question_number" not in a or "answer" not in a:
                return Response({"error": "Each answer must have 'question_number' and 'answer' fields"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                question_number = int(a["question_number"])
                answer = int(a["answer"]) if a["answer"] != "" else None
            except (ValueError, TypeError):
                return Response({"error": "question_number and answer must be integers"}, status=status.HTTP_400_BAD_REQUEST)
                
            StudentAnswer.objects.update_or_create(
                session=session,
                question_number=question_number,
                defaults={"answer": answer}
            )

        return Response({"message": "Answers submitted."})

class GetAnswersView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        test_id = request.query_params.get("test_id")
        user = request.user

        # اگر session_id داده شده، از آن استفاده کن
        if session_id:
            try:
                session = StudentTestSession.objects.get(id=session_id, user=user)
            except StudentTestSession.DoesNotExist:
                return Response({"error": "Session not found"}, status=404)
        # اگر test_id داده شده، session فعال را پیدا کن
        elif test_id:
            try:
                test = Test.objects.get(id=test_id)
                session = StudentTestSession.objects.get(
                    user=user, 
                    test=test, 
                    status__in=['active', 'inactive']
                )
            except (Test.DoesNotExist, StudentTestSession.DoesNotExist):
                return Response({"error": "No active session found for this test"}, status=404)
        else:
            return Response({"error": "session_id or test_id is required"}, status=400)

        # چک کردن انقضای session
        if session.is_expired():
            session.status = 'expired'
            session.save()
            return Response({"error": "Session has expired"}, status=403)

        answers = StudentAnswer.objects.filter(session=session)
        data = {answer.question_number: answer.answer for answer in answers}

        # برگرداندن اطلاعات session همراه با answers
        return Response({
            "answers": data,
            "session": {
                "id": session.id,
                "test_id": session.test.id,
                "entry_time": session.entry_time.isoformat(),
                "end_time": session.end_time.isoformat(),
                "status": session.status
            }
        })

class FinishTestView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get("session_id")
        try:
            session = StudentTestSession.objects.get(id=session_id, user=request.user)
        except StudentTestSession.DoesNotExist:
            raise ValidationError("Session not found.")

        session.exit_time = timezone.now()
        session.status = 'completed'
        session.save()
        print(session.status)
        return Response({"message": "Test finished."})

class ExitTestView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # session_id = request.data.get("session_id")
        device_id = request.data.get("device_id")
        user = request.user

        try:
            session = StudentTestSession.objects.get(user=user, status='active')
        except StudentTestSession.DoesNotExist:
            return Response({"error": "Session not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        # ثبت لاگ خروج موقت
        StudentTestSessionLog.objects.create(
            session=session,
            action='logout',
            device_id=device_id,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        session.status = 'inactive'
        session.save()

        return Response({"detail": "You have temporarily exited the test."})

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class CreateReport(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            raise ValidationError("Test not found.")

        # Check if user is the test creator (teacher) or a student who took the test
        # is_teacher = test.teacher == request.user
        
        if not request.user.role == "student":
            # Teacher view - get all sessions for this test
            sessions = StudentTestSession.objects.filter(test=test)
            if not sessions.exists():
                return Response({"test": test.name, "sessions": None, "message": "No students have taken this test yet."}, status=status.HTTP_200_OK)
        else:
            # Student view - only get their own sessions
            sessions = StudentTestSession.objects.filter(test=test, user=request.user)
            if not sessions.exists():
                return Response({"message": f"You have not participated in {test.name}"}, status=status.HTTP_404_NOT_FOUND)
        
        report_data = []

        for session in sessions:
            answers = StudentAnswer.objects.filter(session=session)
            correct_answers = 0
            wrong_answers = 0
            total_questions = len(test.primary_keys.all())
            
            # Calculate score
            answer_details = []
            answer_map = {a.question_number: a for a in answers}
            for q_num in range(1, total_questions + 1):
                answer = answer_map.get(q_num)
                try:
                    correct_key = test.primary_keys.get(question_number=q_num)
                    if answer:
                        is_correct = answer.answer == correct_key.answer
                        if is_correct:
                            correct_answers += 1
                        else:
                            wrong_answers += 1
                        student_ans = answer.answer
                    else:
                        # دانش‌آموز پاسخی نداده
                        is_correct = False
                        student_ans = None

                    answer_details.append({
                        "question_number": q_num,
                        "student_answer": student_ans,
                        "correct_answer": correct_key.answer,
                        "is_correct": is_correct
                    })
                except:
                    answer_details.append({
                        "question_number": q_num,
                        "student_answer": student_ans if answer else None,
                        "correct_answer": None,
                        "is_correct": False
                    })

            # Calculate score percentage
            score_percentage = ((3*correct_answers - wrong_answers) / total_questions * 100) if total_questions > 0 else 0
            score_percentage = score_percentage/3
            session_data = {
                "user": {
                    "id": session.user.id,
                    "username": session.user.username,
                    "email": session.user.email,
                    "first_name": session.user.first_name,
                    "last_name": session.user.last_name
                },
                "session_id": session.id,
                "start_time": session.entry_time,
                "end_time": session.exit_time,
                "status": session.status,
                "score": {
                    "correct": correct_answers,
                    "wrong": wrong_answers,
                    "total": total_questions,
                    "percentage": score_percentage
                },
                "answers": answer_details
            }
            
            report_data.append(session_data)

        # Get course information through test_collection
        course_name = None
        if hasattr(test, 'test_collection') and test.test_collection and test.test_collection.courses.exists():
            course = test.test_collection.courses.first()
            course_name = course.title
            
        response_data = {
            "test": {
                "id": test.id,
                "name": test.name,
                "description": test.description,
                "course": course_name,
                "start_time": test.start_time,
                "end_time": test.end_time,
                "duration": int(test.duration.total_seconds() / 60) if test.duration else 0,
                "created_by": test.teacher.username
            },
            "sessions": report_data
        }

        return Response(response_data, status=status.HTTP_200_OK)


class TestCollectionViewSet(viewsets.ModelViewSet):
    """ViewSet برای مدیریت مجموعه آزمون‌ها"""
    queryset = TestCollection.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TestCollectionDetailSerializer
        return TestCollectionSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == "student":
            # دانش‌آموز فقط مجموعه‌هایی را می‌بیند که به آن‌ها دسترسی دارد
            return TestCollection.objects.filter(
                courses__students=user
            ).distinct()
        elif user.role == "teacher":
            # معلم تمام مجموعه‌های فعال را می‌بیند
            return TestCollection.objects.all()
        
        # ادمین همه را می‌بیند
        return TestCollection.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """آمار تفصیلی مجموعه آزمون"""
        user = request.user
        test_collection = self.get_object()
        
        # Check permission - only teachers who created it or admins
        if (user.role == 'teacher' and 
            test_collection.created_by != user and 
            not user.is_staff):
            return Response(
                {'error': 'شما اجازه دسترسی به آمار این مجموعه آزمون را ندارید'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all tests in this collection
        tests = test_collection.tests.all()
        
        # Calculate overall statistics
        total_tests = tests.count()
        total_students = test_collection.get_accessible_students().count()
        
        # Test participation statistics
        test_stats = []
        for test in tests:
            sessions = test.studenttestsession_set.all()
            participated = sessions.count()
            completed = sessions.filter(status='completed').count()
            avg_score = sessions.filter(status='completed').aggregate(
                avg_score=Avg('final_score')
            )['avg_score'] or 0
            
            test_stats.append({
                'test_id': test.id,
                'test_title': test.name,
                'participated_students': participated,
                'completed_students': completed,
                'completion_rate': (completed / total_students * 100) if total_students > 0 else 0,
                'average_score': round(avg_score, 2)
            })
        
        # Student progress statistics
        progress_stats = StudentProgress.objects.filter(test_collection=test_collection)
        
        # محاسبه میانگین پیشرفت به‌صورت دستی چون progress_percentage یک property است
        total_progress = 0
        progress_count = progress_stats.count()
        if progress_count > 0:
            for progress in progress_stats:
                total_progress += progress.progress_percentage
            avg_progress = total_progress / progress_count
        else:
            avg_progress = 0
            
        completed_students = progress_stats.filter(is_completed=True).count()
        
        return Response({
            'collection_info': {
                'id': test_collection.id,
                'title': test_collection.name,
                'total_tests': total_tests,
                'total_students': total_students,
                'created_date': test_collection.created_at
            },
            'overall_stats': {
                'average_progress': round(avg_progress, 2),
                'completed_students': completed_students,
                'completion_rate': (completed_students / total_students * 100) if total_students > 0 else 0
            },
            'test_statistics': test_stats
        })
    
    @action(detail=True, methods=['get'])
    def student_progress(self, request, pk=None):
        """پیشرفت دانش‌آموزان در مجموعه آزمون"""
        test_collection = self.get_object()
        
        if request.user.role == "student":
            # دانش‌آموز فقط پیشرفت خودش را می‌بیند
            progress, created = StudentProgress.objects.get_or_create(
                student=request.user,
                test_collection=test_collection
            )
            if created:
                progress.update_progress()
            
            serializer = StudentProgressSerializer(progress)
            return Response(serializer.data)
        
        elif request.user.role == "teacher":
            # معلم پیشرفت همه دانش‌آموزان را می‌بیند
            students = test_collection.get_accessible_students()
            progress_data = []
            
            for student in students:
                progress, created = StudentProgress.objects.get_or_create(
                    student=student,
                    test_collection=test_collection
                )
                if created:
                    progress.update_progress()
                
                progress_data.append({
                    'id': progress.id,
                    'student_name': f"{student.first_name} {student.last_name}",
                    'completed_tests': progress.completed_tests,
                    'total_score': progress.total_score,
                    'progress_percentage': progress.progress_percentage,
                    'average_score': progress.average_score,
                    'is_completed': progress.is_completed,
                    'last_activity': progress.last_activity
                })
            
            return Response(progress_data)
    
    @action(detail=True, methods=['get'])
    def student_test_results(self, request, pk=None):
        """نتایج آزمون‌های دانش‌آموز در مجموعه آزمون برای نمودار"""
        test_collection = self.get_object()
        user = request.user
        
        if user.role != "student":
            return Response(
                {'error': 'این endpoint فقط برای دانش‌آموزان است'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # دریافت همه آزمون‌های این مجموعه
        tests = test_collection.tests.all().order_by('created_at')
        
        results = []
        for test in tests:
            # پیدا کردن session تکمیل شده دانش‌آموز برای این آزمون
            session = StudentTestSession.objects.filter(
                user=user,
                test=test,
                status='completed'
            ).first()
            
            if session:
                # محاسبه نمره
                answers = StudentAnswer.objects.filter(session=session)
                correct_answers = 0
                wrong_answers = 0
                total_questions = test.get_total_questions()
                
                answer_map = {a.question_number: a for a in answers}
                for q_num in range(1, total_questions + 1):
                    answer = answer_map.get(q_num)
                    try:
                        correct_key = test.primary_keys.get(question_number=q_num)
                        if answer:
                            is_correct = answer.answer == correct_key.answer
                            if is_correct:
                                correct_answers += 1
                            else:
                                wrong_answers += 1
                    except:
                        continue
                
                # محاسبه درصد نمره
                score_percentage = ((3*correct_answers - wrong_answers) / total_questions * 100) if total_questions > 0 else 0
                score_percentage = max(0, score_percentage/3)  # حداقل صفر
                
                results.append({
                    'test_name': test.name,
                    'test_id': test.id,
                    'score': correct_answers,
                    'percentage': round(score_percentage, 1),
                    'date': session.exit_time.strftime('%Y-%m-%d') if session.exit_time else session.entry_time.strftime('%Y-%m-%d'),
                    'total_questions': total_questions,
                    'correct_answers': correct_answers,
                    'wrong_answers': wrong_answers
                })
            else:
                # اگر آزمون داده نشده، نمره صفر
                results.append({
                    'test_name': test.name,
                    'test_id': test.id,
                    'score': 0,
                    'percentage': 0,
                    'date': None,
                    'total_questions': test.get_total_questions(),
                    'correct_answers': 0,
                    'wrong_answers': 0
                })
        
        return Response(results)


class SecureTestFileView(views.APIView):
    """
    View امن برای دسترسی به فایل‌های آزمون
    فقط کاربران مجاز می‌توانند به فایل‌ها دسترسی داشته باشند
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id, file_type):
        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            raise Http404("آزمون یافت نشد")

        user = request.user

        # بررسی دسترسی برای فایل PDF سوالات
        if file_type == 'pdf':
            # معلم همیشه می‌تواند فایل PDF را ببیند
            if user.role == 'teacher' and test.teacher == user:
                file_obj = test.pdf_file
            # دانش‌آموز فقط در صورت داشتن session فعال یا غیرفعال (اما معتبر)
            elif user.role == 'student':
                active_session = StudentTestSession.objects.filter(
                    user=user,
                    test=test,
                    status__in=['active', 'inactive']  # هم active و هم inactive قبول شود
                ).first()
                
                if not active_session:
                    raise PermissionDenied("برای دسترسی به سوالات باید ابتدا آزمون را شروع کنید")
                
                # بررسی اینکه آیا زمان آزمون هنوز تمام نشده
                from django.utils import timezone
                if timezone.now() > active_session.end_time:
                    active_session.status = 'expired'
                    active_session.save()
                    raise PermissionDenied("زمان آزمون به پایان رسیده است")
                    
                file_obj = test.pdf_file
            else:
                raise PermissionDenied("شما مجاز به دسترسی به این فایل نیستید")

        # بررسی دسترسی برای فایل پاسخنامه
        elif file_type == 'answers':
            # فقط معلم می‌تواند پاسخنامه را ببیند
            if user.role != 'teacher' or test.teacher != user:
                raise PermissionDenied("فقط معلم آزمون می‌تواند پاسخنامه را ببیند")
            file_obj = test.answers_file
        else:
            raise Http404("نوع فایل نامعتبر")

        if not file_obj or not file_obj.file:
            raise Http404("فایل یافت نشد")

        # ارسال فایل
        response = HttpResponse(file_obj.file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{file_obj.file.name}"'
        return response


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateSerializer
        return QuestionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Question.objects.filter(created_by=user)
        return Question.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class OptionViewSet(viewsets.ModelViewSet):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Option.objects.filter(question__created_by=user)
        return Option.objects.filter(question__is_active=True)


class QuestionImageViewSet(viewsets.ModelViewSet):
    queryset = QuestionImage.objects.all()
    serializer_class = QuestionImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return QuestionImage.objects.filter(question__created_by=user)
        return QuestionImage.objects.filter(question__is_active=True)
        
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)