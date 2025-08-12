from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from .models import Test, StudentTestSession, StudentAnswer, PrimaryKey, StudentTestSessionLog
from .serializers import TestCreateSerializer, TestUpdateSerializer, TestDetailSerializer
from rest_framework.exceptions import ValidationError
import pytz
import json



class ListCreateTestView(generics.ListCreateAPIView):
    serializer_class = TestCreateSerializer
    permission_classes = [IsAuthenticated]  # Only teachers in practice
    queryset = Test.objects.all()


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
        # فقط آزمون‌هایی که این کاربر (مثلاً معلم) ساخته دیده و ویرایش/حذف بشن (اگر creator اضافه کردی)
        return Test.objects.all()

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
            "entry_time": session.entry_time,
            "end_time": session.entry_time + test.duration
        }, status=201)


class SubmitAnswerView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        session_id = request.data.get("session_id")
        answers = request.data.get("answers")  # list of dicts: [{"question_number": 1, "answer": 2}, ...]
        user = request.user

        try:
            session = StudentTestSession.objects.get(id=session_id, user=user)
        except StudentTestSession.DoesNotExist:
            raise ValidationError("Session not found.")

        now = timezone.now()
        if now > session.entry_time + session.test.duration:
            return Response({"error": "Time is up."}, status=403)
        
        if isinstance(answers, str):
            try:
                answers = json.loads(answers)
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON in answers"}, status=status.HTTP_400_BAD_REQUEST)


        for a in answers:
            StudentAnswer.objects.update_or_create(
                session=session,
                question_number= a["question_number"],
                defaults={"answer": a["answer"]}
            )

        return Response({"message": "Answers submitted."})

class GetAnswersView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        user = request.user

        try:
            session = StudentTestSession.objects.get(id=session_id, user=user)
        except StudentTestSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

        answers = StudentAnswer.objects.filter(session=session)
        data = {answer.question_number: answer.answer for answer in answers}

        return Response(data)

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


        sessions = StudentTestSession.objects.filter(test=test, user=request.user)
        if len(sessions) == 0:
            return Response({"message": f"{request.user} did not participate in {test.name}"})
        report_data = []


        for session in sessions:
            answers = StudentAnswer.objects.filter(session=session)
            report_data.append({
                "user": session.user.username,
                "answers": {answer.question_number: answer.answer for answer in answers}
            })

        return Response({"test": test.name, "report": report_data})