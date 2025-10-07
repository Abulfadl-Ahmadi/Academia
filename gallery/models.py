from django.db import models
from django.utils.translation import gettext_lazy as _


class GalleryImage(models.Model):
    title = models.CharField(
        max_length=255,
        verbose_name=_("Title"),
        help_text=_("Title of the gallery image")
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Description of the gallery image")
    )
    
    image = models.ImageField(
        upload_to='gallery/',
        verbose_name=_("Image"),
        help_text=_("Gallery image file")
    )
    
    is_published = models.BooleanField(
        default=True,
        verbose_name=_("Is Published"),
        help_text=_("Whether this image is published and visible to users")
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Order"),
        help_text=_("Display order (lower numbers appear first)")
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At")
    )
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = _("Gallery Image")
        verbose_name_plural = _("Gallery Images")
    
    def __str__(self):
        return self.title
