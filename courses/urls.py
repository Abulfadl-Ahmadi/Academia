from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'courses', views.CourseViewSet, basename='courses')
router.register(r'course-catagory', views.ClassCategoryViewSet, basename='course-catagory')
router.register(r'teacher-courses', views.TeacherCourseViewSet, basename='teacher-courses')
router.register(r'student-courses', views.StudentCourseViewSet, basename='student-courses')
router.register(r'sessions', views.CourseSessionViewSet, basename='sessions')
router.register(r'student-sessions', views.StudentSessionViewSet, basename='student-sessions')
router.register(r'schedules', views.CourseScheduleViewSet, basename='schedules')

urlpatterns = [
    path('', include(router.urls)),
    # Student Dashboard API endpoints
    path('student/active-courses/', views.StudentActiveCoursesView.as_view(), name='student-active-courses'),
    path('student/purchased-courses/', views.StudentPurchasedCoursesView.as_view(), name='student-purchased-courses'),
    path('student/downloadable-files/', views.StudentDownloadableFilesView.as_view(), name='student-downloadable-files'),
    path('student/dashboard-stats/', views.StudentDashboardStatsView.as_view(), name='student-dashboard-stats'),
    # Teacher Dashboard API endpoints
    path('teacher/analytics/', views.TeacherAnalyticsView.as_view(), name='teacher-analytics'),
    path('teacher/due-activities/', views.TeacherDueActivitiesView.as_view(), name='teacher-due-activities'),
    path('teacher/schedule/', views.TeacherScheduleView.as_view(), name='teacher-schedule'),
    path('teacher/quick-stats/', views.TeacherQuickStatsView.as_view(), name='teacher-quick-stats'),
    # path('courses/<int:course_id>/tests/', views.CourseTestViewSet.as_view(), name='course-tests'),
]
