from django.db import models
from django.core.files.storage import default_storage
from django.utils.translation import gettext_lazy as _
from courses.models import Course, CourseSession
from PIL import Image
from api.storage import PublicMediaStorage


class File(models.Model):
    class FileType(models.TextChoices):
        VIDEO = 'video/mp4', _('Video')
        PDF = 'application/pdf', _('PDF')

    class ContentType(models.TextChoices):
        BOOK = 'book', _('Book')
        TEST = 'test', _('Test')
        NOTE = 'note', _('Note')

    file_id = models.CharField(
        max_length=1024,
        help_text="Remote or CDN file identifier (e.g., ArvanCloud UID)"
    )

    file = models.FileField(
        upload_to='documents/',
        help_text="Uploaded file (PDF or MP4)",
        null=True, blank=True
    )

    file_type = models.CharField(
        max_length=50,
        choices=FileType.choices,
        help_text="MIME type of the file"
    )

    content_type = models.CharField(
        max_length=50,
        choices=ContentType.choices,
        default=ContentType.NOTE,
        help_text="Content type of the file (e.g., 'Book', 'Test', 'Note')"
    )

    title = models.CharField(
        max_length=255,
        help_text="Human-readable title of the file"
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='files',
        help_text="The course this file is associated with",
        null=True,
        blank=True
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

    arvan_url = models.URLField(max_length=500, null=True, blank=True)  # New field for ArvanCloud URL
    
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


class GalleryImage(models.Model):
    """Model for gallery images to be displayed on homepage and other sections"""
    
    title = models.CharField(
        max_length=255,
        help_text="Title of the image",
        verbose_name=_("Title")
    )
    
    description = models.TextField(
        blank=True,
        help_text="Optional description of the image",
        verbose_name=_("Description")
    )
    
    image = models.ImageField(
        upload_to='gallery/',
        storage=PublicMediaStorage(),
        help_text="Gallery image file",
        verbose_name=_("Image")
    )
    
    is_published = models.BooleanField(
        default=True,
        help_text="Whether this image is published and visible to users",
        verbose_name=_("Is Published")
    )
    
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (lower numbers appear first)",
        verbose_name=_("Order")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Resize image if it's too large
        if self.image:
            try:
                img = Image.open(self.image.path)
                if img.height > 1080 or img.width > 1920:
                    output_size = (1920, 1080)
                    img.thumbnail(output_size, Image.Resampling.LANCZOS)
                    img.save(self.image.path, optimize=True, quality=85)
            except Exception as e:
                # Log error but don't fail the save
                pass
    
    def delete(self, *args, **kwargs):
        if self.image:
            default_storage.delete(self.image.name)
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = _("Gallery Image")
        verbose_name_plural = _("Gallery Images")



class Grade(models.TextChoices):
    TEN = 'ten', 'دهم'
    ELEVEN = 'eleven', 'یازدهم'
    TWELVE = 'twelve', 'دوازدهم'

class Subject(models.TextChoices):
    MATHEMATICS = 'mathematics', 'ریاضی'
    EXPERIMENTAL_SCIENCES = 'experimental_sciences', 'علوم تجربی'
    HUMANITIES = 'humanities', 'علوم انسانی'
    FOREIGN_LANGUAGES = 'foreign_languages', 'زبان‌های خارجی'

class OfficialBook(models.Model):
    """Model for official books associated with courses"""
    
    title = models.CharField(
        max_length=255,
        help_text="Title of the official book",
        verbose_name=_("Title")
    )
     
    publication_year = models.PositiveIntegerField(
        help_text="Year the book was published",
        verbose_name=_("Publication Year")
    )

    cover_image = models.ImageField(
        upload_to='official_books/covers/',
        storage=PublicMediaStorage(),
        help_text="Cover image of the book",
        verbose_name=_("Cover Image")
    )
    
    pdf_file = models.FileField(
        upload_to='official_books/pdfs/',
        storage=PublicMediaStorage(),
        help_text="PDF file of the book",
        verbose_name=_("PDF File"),
        blank=True,
        null=True
    )
    
    file_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
    )
    
    grade = models.CharField(
        max_length=20,
        choices=Grade.choices,
        default=Grade.TEN,
        verbose_name="نوع آزمون"
    )
    
    subject = models.CharField(
        max_length=50,
        choices=Subject.choices,
        default=Subject.MATHEMATICS,
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def delete(self, *args, **kwargs):
        if self.cover_image:
            default_storage.delete(self.cover_image.name)
        if self.pdf_file:
            default_storage.delete(self.pdf_file.name)
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} by {self.author}"
    
    class Meta:
        ordering = ['-publication_year', 'title']
        verbose_name = _("Official Book")
        verbose_name_plural = _("Official Books")
