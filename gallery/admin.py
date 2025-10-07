from django.contrib import admin
from .models import GalleryImage


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_published', 'order', 'created_at']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['is_published', 'order']
    ordering = ['order', '-created_at']
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'description', 'image')
        }),
        ('Publication', {
            'fields': ('is_published', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
