from django.db import models
from django.core.files.storage import default_storage
from django.utils.translation import gettext_lazy as _
from courses.models import Course, CourseSession


class File(models.Model):
    class FileType(models.TextChoices):
        VIDEO = 'video/mp4', _('Video')
        PDF = 'application/pdf', _('PDF')

    file_id = models.CharField(
        max_length=1024,
        help_text="Remote or CDN file identifier (e.g., ArvanCloud UID)"
    )

    file = models.FileField(
        upload_to='documents/',
        help_text="Uploaded file (PDF or MP4)"
    )

    file_type = models.CharField(
        max_length=50,
        choices=FileType.choices,
        help_text="MIME type of the file"
    )

    title = models.CharField(
        max_length=255,
        help_text="Human-readable title of the file"
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='files',
        help_text="The course this file is associated with"
    )

    session = models.ForeignKey(
        CourseSession,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='files',
        help_text="The specific course session, if applicable"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def delete(self, *args, **kwargs):
        if self.file:
            default_storage.delete(self.file.name)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_file_type_display()})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "File"
        verbose_name_plural = "Files"
