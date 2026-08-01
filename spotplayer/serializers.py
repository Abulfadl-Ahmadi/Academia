from django.conf import settings
from rest_framework import serializers

from .models import SpotPlayerLicense


class SpotPlayerLicenseSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    spotplayer_download_url = serializers.SerializerMethodField()

    class Meta:
        model = SpotPlayerLicense
        fields = (
            "id",
            "course",
            "course_title",
            "spotplayer_license_id",
            "spotplayer_license_key",
            "spotplayer_url",
            "spotplayer_download_url",
            "watermark_text",
            "test_mode",
            "metadata",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_spotplayer_download_url(self, obj):
        dl_domain = getattr(
            settings, "SPOTPLAYER_DL_DOMAIN", "https://dl.spotplayer.ir"
        ).rstrip("/")
        if not obj.spotplayer_url:
            return None
        return f"{dl_domain}{obj.spotplayer_url}"


class SpotPlayerLicenseAdminSerializer(serializers.ModelSerializer):
    """Teacher/admin-facing serializer that includes student + device info."""

    student_id = serializers.IntegerField(source="user.id", read_only=True)
    student_name = serializers.CharField(source="user.username", read_only=True)
    student_email = serializers.EmailField(source="user.email", read_only=True)
    student_phone = serializers.SerializerMethodField()
    device_limit = serializers.SerializerMethodField()

    class Meta:
        model = SpotPlayerLicense
        fields = (
            "id",
            "course",
            "student_id",
            "student_name",
            "student_email",
            "student_phone",
            "spotplayer_license_id",
            "spotplayer_license_key",
            "spotplayer_url",
            "watermark_text",
            "test_mode",
            "device_limit",
            "metadata",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_student_phone(self, obj):
        profile = getattr(obj.user, "profile", None)
        if profile is not None:
            return getattr(profile, "phone_number", None)
        return None

    def get_device_limit(self, obj):
        if not obj.metadata:
            return "default"
        device = obj.metadata.get("device")
        return device if device is not None else "default"

