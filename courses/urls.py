from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseScheduleViewSet, CourseSessionViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="courses")
router.register(r"schedules", CourseScheduleViewSet, basename="schedules")
router.register(r"sessions", CourseSessionViewSet, basename="sessions")

urlpatterns = router.urls
