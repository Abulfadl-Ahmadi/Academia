from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Course, CourseSchedule, CourseSession
from utils import vod
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
        try:
            vod_response = vod.create_channel(self.request.data)
            vod_channel_id = vod_response["data"]["id"]
        except Exception as e:
            return ValidationError({"error": str(e)})

        # Auto-assign the logged-in teacher (if applicable)
        if self.request.user.role == "teacher":
            serializer.save(teacher=self.request.user, vod_channel_id=vod_channel_id)
        else:
            serializer.save(vod_channel_id=vod_channel_id)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        vod_channel_id = course.vod_channel_id

        # Delete the course from DB first
        response = super().destroy(request, *args, **kwargs)

        # Then attempt to delete the VOD channel
        if vod_channel_id:
            try:
                vod.delete_channel(vod_channel_id)
            except Exception as e:
                # Log it but don’t block deletion
                print(f"[WARNING] Failed to delete VOD channel {vod_channel_id}: {e}")

        return response


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
