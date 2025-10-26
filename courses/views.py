from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
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
from contents.models import File
from shop.models import Product
from finance.models import Order, OrderItem
from finance.models import Transaction


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


# Student Dashboard API Endpoints
class StudentActiveCoursesView(APIView):
    """Get student's active courses for dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {"error": "Only students can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get courses where student is enrolled and course is active
        courses = Course.objects.filter(
            students=request.user,
            is_active=True
        ).annotate(
            students_count=Count('students'),
            sessions_count=Count('sessions'),
            tests_count=Count('test_collections__tests')
        ).order_by('-created_at')[:6]  # Limit to 6 most recent
        
        serializer = StudentCourseSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)


class StudentPurchasedCoursesView(APIView):
    """Get student's purchased courses for dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {"error": "Only students can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get courses where student has purchased access
        courses = Course.objects.filter(
            students=request.user
        ).annotate(
            students_count=Count('students'),
            sessions_count=Count('sessions'),
            tests_count=Count('test_collections__tests')
        ).order_by('-created_at')[:6]  # Limit to 6 most recent
        
        serializer = StudentCourseSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)


class StudentDownloadableFilesView(APIView):
    """Get student's downloadable files for dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {"error": "Only students can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get files from courses where student is enrolled
        files = File.objects.filter(
            course__students=request.user
        ).select_related('course').order_by('-created_at')[:10]  # Limit to 10 most recent
        
        # Simple serializer for file data
        file_data = []
        for file in files:
            file_data.append({
                'id': file.id,
                'name': file.name,
                'file_type': file.file_type,
                'file_size': file.file_size,
                'download_url': file.file.url if file.file else None,
                'course_name': file.course.title if file.course else None,
                'created_at': file.created_at,
            })
        
        return Response(file_data)


class StudentDashboardStatsView(APIView):
    """Get student dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {"error": "Only students can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get statistics
        total_courses = Course.objects.filter(students=request.user).count()
        active_courses = Course.objects.filter(students=request.user, is_active=True).count()
        total_sessions = CourseSession.objects.filter(
            course__students=request.user,
            is_published=True
        ).count()
        total_files = File.objects.filter(
            course__students=request.user
        ).count()
        
        # Get recent activity (last 5 sessions)
        recent_sessions = CourseSession.objects.filter(
            course__students=request.user,
            is_published=True
        ).select_related('course').order_by('-created_at')[:5]
        
        recent_activity = []
        for session in recent_sessions:
            recent_activity.append({
                'id': session.id,
                'title': session.title,
                'course_name': session.course.title,
                'created_at': session.created_at,
                'type': 'session'
            })
        
        stats = {
            'total_courses': total_courses,
            'active_courses': active_courses,
            'total_sessions': total_sessions,
            'total_files': total_files,
            'recent_activity': recent_activity
        }
        
        return Response(stats)


# Teacher Dashboard API Endpoints
class TeacherAnalyticsView(APIView):
    """Get teacher analytics and statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['teacher', 'admin']:
            return Response(
                {"error": "Only teachers can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher's courses
        if request.user.role == 'admin':
            courses = Course.objects.all()
        else:
            courses = Course.objects.filter(teacher=request.user)
        
        # Calculate analytics
        total_courses = courses.count()
        active_courses = courses.filter(is_active=True).count()
        total_students = courses.aggregate(
            total=Count('students', distinct=True)
        )['total'] or 0
        
        # Get recent activity (last 5 sessions created by teacher)
        recent_sessions = CourseSession.objects.filter(
            course__teacher=request.user
        ).select_related('course').order_by('-created_at')[:5]
        
        recent_activity = []
        for session in recent_sessions:
            recent_activity.append({
                'id': session.id,
                'title': session.title,
                'course_name': session.course.title,
                'created_at': session.created_at,
                'type': 'session'
            })
        
        # Get courses with most students
        popular_courses = courses.annotate(
            student_count=Count('students')
        ).order_by('-student_count')[:3]
        
        popular_courses_data = []
        for course in popular_courses:
            popular_courses_data.append({
                'id': course.id,
                'name': course.title,
                'student_count': course.student_count,
                'description': course.description
            })
        
        analytics = {
            'total_courses': total_courses,
            'active_courses': active_courses,
            'total_students': total_students,
            'recent_activity': recent_activity,
            'popular_courses': popular_courses_data
        }
        
        return Response(analytics)


class TeacherDueActivitiesView(APIView):
    """Get teacher's due activities"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['teacher', 'admin']:
            return Response(
                {"error": "Only teachers can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher's courses
        if request.user.role == 'admin':
            courses = Course.objects.all()
        else:
            courses = Course.objects.filter(teacher=request.user)
        
        due_activities = []
        
        # Get upcoming sessions (next 7 days)
        from datetime import datetime, timedelta
        now = timezone.now()
        next_week = now + timedelta(days=7)
        
        # Since CourseSession doesn't have scheduled_time, get published sessions
        # that were created recently (as a proxy for "upcoming")
        upcoming_sessions = CourseSession.objects.filter(
            course__in=courses,
            is_published=True,
            created_at__gte=now - timedelta(days=30)  # Sessions created in last 30 days
        ).select_related('course').order_by('-created_at')[:10]  # Limit to 10 most recent
        
        for session in upcoming_sessions:
            due_activities.append({
                'id': session.id,
                'title': session.title,
                'course_name': session.course.title,
                'scheduled_time': session.created_at,  # Use created_at as proxy for scheduled time
                'type': 'session',
                'priority': 'medium'  # Default priority since we don't have actual scheduling
            })
        
        # Get tests that need grading (if any)
        # Note: Grading system not yet implemented, counting completed sessions as needing grading
        from tests.models import Test, StudentTestSession
        tests_to_grade = Test.objects.filter(
            test_collection__courses__in=courses
        ).annotate(
            pending_sessions=Count('studenttestsession', filter=Q(
                studenttestsession__status='completed'
            ))
        ).filter(pending_sessions__gt=0)
        
        for test in tests_to_grade:
            due_activities.append({
                'id': test.id,
                'title': f"Grade {test.title}",
                'course_name': test.test_collection.courses.first().title if test.test_collection.courses.exists() else 'Unknown',
                'pending_count': test.pending_sessions,
                'type': 'grading',
                'priority': 'high'
            })
        
        # Sort by priority and date
        due_activities.sort(key=lambda x: (
            0 if x['priority'] == 'high' else 1,
            x.get('scheduled_time', now) if x.get('scheduled_time') else now
        ))
        
        return Response(due_activities[:10])  # Limit to 10 most important


class TeacherScheduleView(APIView):
    """Get teacher's schedule overview"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['teacher', 'admin']:
            return Response(
                {"error": "Only teachers can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher's courses
        if request.user.role == 'admin':
            courses = Course.objects.all()
        else:
            courses = Course.objects.filter(teacher=request.user)
        
        # Get today's classes
        today = timezone.now().date()
        today_sessions = CourseSession.objects.filter(
            course__in=courses,
            is_published=True,  # Use published sessions as proxy
            created_at__date=today  # Use created_at date as proxy
        ).select_related('course').order_by('-created_at')
        
        today_classes = []
        for session in today_sessions:
            today_classes.append({
                'id': session.id,
                'title': session.title,
                'course_name': session.course.title,
                'scheduled_time': session.created_at,  # Use created_at as proxy
                'duration': None,  # Not available in current model
                'is_live': session.course.is_live  # Use course's live status
            })
        
        # Get this week's schedule
        from datetime import timedelta
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        week_sessions = CourseSession.objects.filter(
            course__in=courses,
            is_published=True,  # Use published sessions
            created_at__date__gte=week_start,
            created_at__date__lte=week_end
        ).select_related('course').order_by('-created_at')
        
        week_schedule = []
        for session in week_sessions:
            week_schedule.append({
                'id': session.id,
                'title': session.title,
                'course_name': session.course.title,
                'scheduled_time': session.created_at,  # Use created_at as proxy
                'duration': None,  # Not available
                'is_live': session.course.is_live,  # Use course's live status
                'day_of_week': session.created_at.strftime('%A')  # Use created_at day
            })
        
        schedule = {
            'today_classes': today_classes,
            'week_schedule': week_schedule,
            'total_sessions_this_week': week_sessions.count(),
            'total_sessions_today': today_sessions.count()
        }
        
        return Response(schedule)


class TeacherQuickStatsView(APIView):
    """Get teacher's quick statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['teacher', 'admin']:
            return Response(
                {"error": "Only teachers can access this endpoint"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get teacher's courses
        if request.user.role == 'admin':
            courses = Course.objects.all()
        else:
            courses = Course.objects.filter(teacher=request.user)
        
        # Calculate quick stats
        total_courses = courses.count()
        active_courses = courses.filter(is_active=True).count()
        total_students = courses.aggregate(
            total=Count('students', distinct=True)
        )['total'] or 0
        
        # Get recent sessions count (last 30 days)
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_sessions = CourseSession.objects.filter(
            course__in=courses,
            created_at__gte=thirty_days_ago
        ).count()
        
        # Get upcoming sessions (next 7 days) - using published sessions as proxy
        from datetime import timedelta
        next_week = timezone.now() + timedelta(days=7)
        upcoming_sessions = CourseSession.objects.filter(
            course__in=courses,
            is_published=True,
            created_at__lte=next_week
        ).count()
        
        stats = {
            'total_courses': total_courses,
            'active_courses': active_courses,
            'total_students': total_students,
            'recent_sessions': recent_sessions,
            'upcoming_sessions': upcoming_sessions
        }
        
        return Response(stats)
