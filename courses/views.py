from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Prefetch, Avg
from django.utils import timezone
from .models import Course, CourseSession, CourseSchedule, ClassCategory
from .serializers import (
    CourseSerializer, CourseSessionSerializer, CourseScheduleSerializer,
    TeacherCourseSerializer, StudentCourseSerializer, StudentSessionSerializer,
    ClassCategorySerializer, UserSerializer
)
from accounts.models import User
from tests.models import Test
from tests.serializers import TestCreateSerializer
from utils.vod import create_channel


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Course.objects.all().annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('test_collections__tests')
            )
        elif user.role == 'teacher':
            return Course.objects.filter(teacher=user).annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('test_collections__tests')
            )
        else:  # student
            return Course.objects.filter(students=user).annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('test_collections__tests')
            )

    def get_serializer_class(self):
        user = self.request.user
        if self.action in ['update', 'partial_update', 'retrieve']:
            if user.role in ['teacher', 'admin']:
                return TeacherCourseSerializer
            elif user.role == 'student':
                return StudentCourseSerializer
        elif self.action == 'list':
            if user.role == 'teacher':
                return TeacherCourseSerializer
            elif user.role == 'student':
                return StudentCourseSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        vod_channel_id = create_channel(serializer.validated_data)['data']['id']

        if self.request.user.role == 'teacher':
            serializer.save(teacher=self.request.user, vod_channel_id=vod_channel_id)
        else:
            serializer.save(vod_channel_id=vod_channel_id)
            
    def destroy(self, request, *args, **kwargs):
        if self.get_object().vod_channel_id:
            # If the course has a vod_channel_id, delete the channel
            from utils.vod import delete_channel
            delete_channel(self.get_object().vod_channel_id)
        return super().destroy(request, *args, **kwargs)

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

    @action(detail=True, methods=['get'])
    def tests(self, request, pk=None):
        course = self.get_object()
        tests = Test.objects.filter(test_collection__courses=course)
        serializer = TestCreateSerializer(tests, many=True, context={'request': request})
        return Response(serializer.data)
        
    @action(detail=True, methods=['get'])
    def test_collections(self, request, pk=None):
        """Get test collections for a specific course"""
        course = self.get_object()
        from tests.models import TestCollection
        from tests.serializers import TestCollectionSerializer
        
        collections = TestCollection.objects.filter(courses=course)
        serializer = TestCollectionSerializer(collections, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def schedules(self, request, pk=None):
        """Get or create schedules for a specific course"""
        course = self.get_object()
        
        if request.method == 'GET':
            schedules = CourseSchedule.objects.filter(course=course)
            serializer = CourseScheduleSerializer(schedules, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Only teachers can create schedules for their courses
            if request.user.role not in ['admin', 'teacher']:
                return Response(
                    {"error": "Only teachers can create schedules"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if request.user.role == 'teacher' and course.teacher != request.user:
                return Response(
                    {"error": "You can only create schedules for your own courses"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Add the course to the request data
            data = request.data.copy()
            data['course'] = course.id
            
            serializer = CourseScheduleSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ClassCategoryViewSet(viewsets.ModelViewSet):
    queryset = ClassCategory.objects.all()
    serializer_class = ClassCategorySerializer

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
                tests_count=Count('test_collections__tests')
            )
        else:
            return Course.objects.filter(teacher=user).annotate(
                students_count=Count('students'),
                sessions_count=Count('sessions'),
                tests_count=Count('test_collections__tests')
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
            tests_count=Count('test_collections__tests')
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

    # @action(detail=True, methods=['get'])
    # def student_sessions(self, request, pk=None):
    #     """Get sessions for a student in a specific course"""
    #     if request.user.role != 'student':
    #         return Response(
    #             {"error": "Only students can access this endpoint"}, 
    #             status=status.HTTP_403_FORBIDDEN
    #         )
        
    #     course = self.get_object()
    #     sessions = CourseSession.objects.filter(
    #         course=course,
    #         is_published=True
    #     ).prefetch_related('files')
    #     serializer = StudentSessionSerializer(sessions, many=True, context={'request': request})
    #     return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tests(self, request, pk=None):
        course = self.get_object()
        tests = Test.objects.filter(course=course)
        # Use TestCreateSerializer instead of TestSerializer
        serializer = TestCreateSerializer(tests, many=True, context={'request': request})
        return Response(serializer.data)
