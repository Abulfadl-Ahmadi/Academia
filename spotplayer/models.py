from django.db import models
from django.conf import settings
from courses.models import Course


class SpotPlayerLicense(models.Model):
    """A SpotPlayer DRM license bound to a specific user + course."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="spotplayer_licenses",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="spotplayer_licenses",
    )
    spotplayer_license_id = models.CharField(max_length=64, blank=True, null=True)
    spotplayer_license_key = models.TextField(blank=True, null=True)
    spotplayer_url = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Relative video URL returned by SpotPlayer (e.g. /5e07...ff/).",
    )
    watermark_text = models.CharField(max_length=255, blank=True, null=True)
    test_mode = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [["user", "course"]]
        verbose_name = "SpotPlayer License"
        verbose_name_plural = "SpotPlayer Licenses"

    def __str__(self):
        return f"{self.user} - {self.course}"

    @property
    def is_test_license(self):
        return self.test_mode
