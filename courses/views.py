from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Prefetch
from .models import Course, CourseSession, CourseSchedule
from .serializers import (
    CourseSerializer, CourseSessionSerializer, CourseScheduleSerializer,
    TeacherCourseSerializer, StudentCourseSerializer, StudentSessionSerializer
)
from accounts.models import User
from tests.models import Test


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Course.objects.all().annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('tests')
            )
        elif user.role == 'teacher':
            return Course.objects.filter(teacher=user).annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('tests')
            )
        else:  # student
            return Course.objects.filter(students=user).annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('tests')
            )

    def get_serializer_class(self):
        if self.action == 'list' and self.request.user.role == 'teacher':
            return TeacherCourseSerializer
        elif self.action == 'list' and self.request.user.role == 'student':
            return StudentCourseSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        if self.request.user.role == 'teacher':
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['get'])
    def sessions(self, request, pk=None):
        """Get sessions for a specific course"""
        course = self.get_object()
        user = request.user
        
        if user.role == 'student':
            sessions = CourseSession.objects.filter(
                course=course,
                is_published=True
            ).prefetch_related('files')
            serializer = StudentSessionSerializer(sessions, many=True, context={'request': request})
        else:
            sessions = CourseSession.objects.filter(course=course).prefetch_related('files')
            serializer = CourseSessionSerializer(sessions, many=True)
        
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='student-sessions')
    def student_sessions(self, request, pk=None):
        """Get sessions for a student in a specific course"""
        if request.user.role != 'student':
            return Response(
                {"error": "Only students can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        course = self.get_object()
        sessions = CourseSession.objects.filter(
            course=course,
            is_published=True
        ).prefetch_related('files')
        serializer = StudentSessionSerializer(sessions, many=True, context={'request': request})
        return Response(serializer.data)


class TeacherCourseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TeacherCourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ['admin', 'teacher']:
            return Course.objects.none()
        
        user = self.request.user
        if user.role == 'admin':
            return Course.objects.all().annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('tests')
            )
        else:
            return Course.objects.filter(teacher=user).annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('tests')
            )


class StudentCourseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StudentCourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'student':
            return Course.objects.none()
        
        return Course.objects.filter(students=self.request.user).annotate(
            students_count=Count('students'),
            sessions_count=Count('sessions'),
            tests_count=Count('tests')
        )


class CourseSessionViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'teacher']:
            return CourseSession.objects.all()
        else:  # student
            return CourseSession.objects.filter(
                course__students=user,
                is_published=True
            )

    def perform_create(self, serializer):
        # Only teachers can create sessions for their courses
        if self.request.user.role not in ['admin', 'teacher']:
            raise permissions.PermissionDenied("Only teachers can create sessions")
        
        course = serializer.validated_data['course']
        if self.request.user.role == 'teacher' and course.teacher != self.request.user:
            raise permissions.PermissionDenied("You can only create sessions for your own courses")
        
        serializer.save()

    @action(detail=True, methods=['post'])
    def mark_watched(self, request, pk=None):
        """Mark a session as watched by a student"""
        if request.user.role != 'student':
            return Response(
                {"error": "Only students can mark sessions as watched"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        session = self.get_object()
        # Here you would typically update a StudentSessionProgress model
        # For now, we'll just return success
        return Response({"message": "Session marked as watched"})


class StudentSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StudentSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'student':
            return CourseSession.objects.none()
        
        # Prefetch related files to include them in the response
        from contents.models import File
        return CourseSession.objects.filter(
            course__students=self.request.user,
            is_published=True
        ).prefetch_related(
            Prefetch('files', queryset=File.objects.all())
        )


class CourseScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = CourseScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'teacher']:
            return CourseSchedule.objects.all()
        else:  # student
            return CourseSchedule.objects.filter(course__students=user)

    def perform_create(self, serializer):
        # Only teachers can create schedules for their courses
        if self.request.user.role not in ['admin', 'teacher']:
            raise permissions.PermissionDenied("Only teachers can create schedules")
        
        course = serializer.validated_data['course']
        if self.request.user.role == 'teacher' and course.teacher != self.request.user:
            raise permissions.PermissionDenied("You can only create schedules for your own courses")
        
        serializer.save()


# Additional views for specific functionality
class CourseDetailView(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Course.objects.all()
        elif user.role == 'teacher':
            return Course.objects.filter(teacher=user)
        else:  # student
            return Course.objects.filter(students=user)

    @action(detail=True, methods=['get'])
    def sessions(self, request, pk=None):
        """Get sessions for a specific course"""
        course = self.get_object()
        user = request.user
        
        if user.role == 'student':
            sessions = CourseSession.objects.filter(
                course=course,
                is_published=True
            ).prefetch_related('files')
            serializer = StudentSessionSerializer(sessions, many=True, context={'request': request})
        else:
            sessions = CourseSession.objects.filter(course=course).prefetch_related('files')
            serializer = CourseSessionSerializer(sessions, many=True)
        
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def student_sessions(self, request, pk=None):
        """Get sessions for a student in a specific course"""
        if request.user.role != 'student':
            return Response(
                {"error": "Only students can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        course = self.get_object()
        sessions = CourseSession.objects.filter(
            course=course,
            is_published=True
        ).prefetch_related('files')
        serializer = StudentSessionSerializer(sessions, many=True, context={'request': request})
        return Response(serializer.data)