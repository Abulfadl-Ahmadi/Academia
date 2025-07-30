from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, CourseSchedule, CourseSession
from .serializers import (
    CourseSerializer,
    CourseScheduleSerializer,
    CourseSessionSerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().prefetch_related("students", "schedules", "sessions")
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "teacher__user__username"]

    def perform_create(self, serializer):
        # Auto-assign the logged-in teacher (if applicable)
        if self.request.user.role == "teacher":
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=["get"])
    def schedules(self, request, pk=None):
        course = self.get_object()
        schedules = course.schedules.all()
        serializer = CourseScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def sessions(self, request, pk=None):
        course = self.get_object()
        sessions = course.sessions.all()
        serializer = CourseSessionSerializer(sessions, many=True)
        return Response(serializer.data)


class CourseScheduleViewSet(viewsets.ModelViewSet):
    queryset = CourseSchedule.objects.all()
    serializer_class = CourseScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]


class CourseSessionViewSet(viewsets.ModelViewSet):
    queryset = CourseSession.objects.all()
    serializer_class = CourseSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
