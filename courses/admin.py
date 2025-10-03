from django.contrib import admin
from .models import Course, CourseSession, CourseSchedule, ClassCategory


class CourseScheduleInline(admin.TabularInline):
    model = CourseSchedule
    extra = 0


class CourseSessionInline(admin.TabularInline):
    model = CourseSession
    extra = 0
    readonly_fields = ('created_at', 'updated_at')
    fields = ('title', 'session_number', 'description', 'is_published', 'created_at')


@admin.register(ClassCategory)
class ClassCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'courses_count')
    search_fields = ('name', 'description')
    
    def courses_count(self, obj):
        return obj.course_set.count()
    courses_count.short_description = 'Number of Courses'


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'category', 'students_count', 'sessions_count', 'schedules_count', 'has_rtmp', 'is_live', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_live', 'created_at', 'teacher__role', 'category']
    search_fields = ['title', 'description', 'teacher__username', 'vod_channel_id', 'rtmp_url']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['students']
    inlines = [CourseScheduleInline, CourseSessionInline]
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'teacher')
        }),
        ('Students', {
            'fields': ('students',)
        }),
        ('Technical', {
            'fields': ('vod_channel_id', 'is_active')
        }),
        ('RTMP Streaming', {
            'fields': ('rtmp_url', 'rtmp_key', 'live_iframe', 'is_live'),
            'description': 'تنظیمات پخش زنده RTMP'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def students_count(self, obj):
        return obj.students.count()
    students_count.short_description = 'تعداد دانش‌آموزان'
    
    def sessions_count(self, obj):
        return obj.sessions.count()
    sessions_count.short_description = 'تعداد جلسات'
    
    def schedules_count(self, obj):
        return obj.schedules.count()
    schedules_count.short_description = 'تعداد برنامه‌ها'
    
    def has_rtmp(self, obj):
        return bool(obj.rtmp_url and obj.rtmp_key)
    has_rtmp.boolean = True
    has_rtmp.short_description = 'RTMP فعال'


@admin.register(CourseSchedule)
class CourseScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'get_day_display', 'time')
    list_filter = ('day', 'course')
    search_fields = ('course__title',)
    ordering = ('course', 'day', 'time')


@admin.register(CourseSession)
class CourseSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'session_number', 'is_published', 'has_video', 'has_lecture_notes', 'created_at']
    list_filter = ['is_published', 'created_at', 'course']
    search_fields = ['title', 'description', 'course__title']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['is_published']
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'title', 'session_number', 'description')
        }),
        ('Publishing', {
            'fields': ('is_published',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_video(self, obj):
        return obj.files.filter(file_type='video/mp4').exists()
    has_video.boolean = True
    has_video.short_description = 'ویدیو دارد'
    
    def has_lecture_notes(self, obj):
        return obj.files.filter(file_type='application/pdf').exists()
    has_lecture_notes.boolean = True
    has_lecture_notes.short_description = 'جزوه دارد'




