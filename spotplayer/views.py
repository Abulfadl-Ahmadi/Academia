import logging
import re

import requests
from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course
from .models import SpotPlayerLicense
from .serializers import SpotPlayerLicenseSerializer, SpotPlayerLicenseAdminSerializer
from .services import provision_license_for_course

logger = logging.getLogger(__name__)


class CourseLicenseView(APIView):
    """
    GET /api/spotplayer/courses/<course_id>/license/

    Returns the authenticated user's SpotPlayer license for the given course,
    creating it on-the-fly if missing (idempotent). Non-enrolled users get 403
    and non-existent courses get 404.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = Course.objects.filter(pk=course_id).first()
        if course is None:
            return Response(
                {"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND
            )

        is_admin = getattr(request.user, "role", None) == "admin"
        is_enrolled = course.students.filter(id=request.user.id).exists()
        if not is_enrolled and not is_admin:
            return Response(
                {"detail": "You must be enrolled in this course to access its license."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not getattr(course, "spotplayer_course_id", None):
            return Response(
                {"detail": "This course does not have SpotPlayer configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        license_obj, created, error = provision_license_for_course(request.user, course)

        if license_obj is None:
            return Response(
                {"detail": error or "Failed to create SpotPlayer license."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "license": SpotPlayerLicenseSerializer(license_obj).data,
                "created": created,
            }
        )


class CourseLicensesListView(APIView):
    """
    GET /api/spotplayer/courses/<course_id>/licenses/

    List all SpotPlayer licenses issued for a course. Teacher/admin only.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        if request.user.role not in ("teacher", "admin"):
            return Response(
                {"detail": "Only teachers and admins can view issued licenses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        course = Course.objects.filter(pk=course_id).first()
        if course is None:
            return Response(
                {"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Teachers may only inspect their own courses.
        if request.user.role == "teacher" and course.teacher_id != request.user.id:
            return Response(
                {"detail": "You do not own this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        licenses = SpotPlayerLicense.objects.filter(course=course).select_related("user")
        serializer = SpotPlayerLicenseAdminSerializer(licenses, many=True)
        return Response({"licenses": serializer.data})


class LicenseRegenerateView(APIView):
    """
    POST /api/spotplayer/courses/<course_id>/licenses/<license_id>/regenerate/

    Forcibly re-provision a fresh SpotPlayer license for a student+course.
    Teacher/admin only.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id, license_id):
        if request.user.role not in ("teacher", "admin"):
            return Response(
                {"detail": "Only teachers and admins can regenerate licenses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        course = Course.objects.filter(pk=course_id).first()
        if course is None:
            return Response(
                {"detail": "Course not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if request.user.role == "teacher" and course.teacher_id != request.user.id:
            return Response(
                {"detail": "You do not own this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        license_obj = SpotPlayerLicense.objects.filter(
            pk=license_id, course=course
        ).first()
        if license_obj is None:
            return Response(
                {"detail": "License not found for this course."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_license, _, error = provision_license_for_course(
            license_obj.user, course, force=True
        )
        if new_license is None:
            return Response(
                {"detail": error or "Failed to regenerate SpotPlayer license."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"license": SpotPlayerLicenseAdminSerializer(new_license).data}
        )


class SpotXProxyView(APIView):
    """
    GET /api/spotplayer/spotx/

    Server-side sync of the 'X' cookie with https://app.spotplayer.ir/ (required
    by the SpotPlayer web player). Relays the refreshed cookie to the browser so
    the player keeps working; the cookie is never exposed as JSON.
    """

    permission_classes = [permissions.AllowAny]

    def _is_expired(self, x_cookie):
        """Expiry timestamp is embedded as hex at X[24:36] (milliseconds)."""
        try:
            return (timezone.now().timestamp() * 1000) > int(x_cookie[24:36], 16)
        except (IndexError, ValueError):
            return True

    def get(self, request):
        x_cookie = request.COOKIES.get("X", "")
        cookie_name = getattr(settings, "SPOTPLAYER_COOKIE_NAME", "X")
        app_url = getattr(settings, "SPOTPLAYER_APP_URL", "https://app.spotplayer.ir")

        if x_cookie and not self._is_expired(x_cookie):
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        try:
            resp = requests.head(
                f"{app_url.rstrip('/')}/",
                headers={"Cookie": f"X={x_cookie}"} if x_cookie else {},
                timeout=10,
                allow_redirects=False,
            )
        except requests.RequestException as exc:
            logger.error("SpotX cookie sync failed: %s", exc)
            return Response(
                {"detail": "Cookie sync failed."}, status=status.HTTP_502_BAD_GATEWAY
            )

        match = re.search(r"X=([a-f0-9]+);", resp.headers.get("Set-Cookie", ""))
        new_x = match.group(1) if match else x_cookie

        response = Response({}, status=status.HTTP_204_NO_CONTENT)
        if new_x:
            response.set_cookie(
                cookie_name,
                new_x,
                max_age=3600 * 24 * 365 * 100,
                domain=request.get_host().split(":")[0],
                secure=True,
                httponly=False,
            )
        return response
