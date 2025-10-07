from django.contrib import admin
from .models import File, GalleryImage


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('title', 'file_type', 'content_type', 'course', 'session', 'has_file', 'has_arvan_url', 'created_at')
    list_filter = ('file_type', 'content_type', 'created_at', 'course')
    search_fields = ('title', 'file_id', 'course__title', 'session__title')
    readonly_fields = ('created_at',)
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'file_type', 'content_type')
        }),
        ('Content', {
            'fields': ('course', 'session', 'file', 'file_id', 'arvan_url')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def has_file(self, obj):
        return bool(obj.file)
    has_file.boolean = True
    has_file.short_description = 'Has Local File'
    
    def has_arvan_url(self, obj):
        return bool(obj.arvan_url)
    has_arvan_url.boolean = True
    has_arvan_url.short_description = 'Has Arvan URL'


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_published', 'order', 'has_image', 'created_at')
    list_filter = ('is_published', 'created_at')
    search_fields = ('title', 'description')
    list_editable = ('is_published', 'order')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'image')
        }),
        ('Display Settings', {
            'fields': ('is_published', 'order')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_image(self, obj):
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = 'Has Image'
