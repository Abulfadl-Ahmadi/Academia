from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'courses', views.CourseViewSet, basename='courses')
router.register(r'teacher-courses', views.TeacherCourseViewSet, basename='teacher-courses')
router.register(r'student-courses', views.StudentCourseViewSet, basename='student-courses')
router.register(r'sessions', views.CourseSessionViewSet, basename='sessions')
router.register(r'student-sessions', views.StudentSessionViewSet, basename='student-sessions')
router.register(r'schedules', views.CourseScheduleViewSet, basename='schedules')

urlpatterns = [
    path('', include(router.urls)),
    # path('courses/<int:course_id>/tests/', views.CourseTestViewSet.as_view(), name='course-tests'),
]
