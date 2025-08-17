from django.contrib import admin
from .models import Course, CourseSession


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'students_count', 'sessions_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at', 'teacher__role']
    search_fields = ['title', 'description', 'teacher__username']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['students']
    
    def students_count(self, obj):
        return obj.students.count()
    students_count.short_description = 'تعداد دانش‌آموزان'
    
    def sessions_count(self, obj):
        return obj.sessions.count()
    sessions_count.short_description = 'تعداد جلسات'


@admin.register(CourseSession)
class CourseSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'session_number', 'is_published', 'has_video', 'has_lecture_notes', 'created_at']
    list_filter = ['is_published', 'created_at', 'course']
    search_fields = ['title', 'description', 'course__title']
    readonly_fields = ['created_at', 'updated_at']
    
    def has_video(self, obj):
        return bool(obj.video_file)
    has_video.boolean = True
    has_video.short_description = 'ویدیو دارد'
    
    def has_lecture_notes(self, obj):
        return bool(obj.lecture_notes)
    has_lecture_notes.boolean = True
    has_lecture_notes.short_description = 'جزوه دارد'




