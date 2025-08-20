from django.contrib import admin
from .models import (
    Test, PrimaryKey, StudentTestSession, 
    StudentTestSessionLog, StudentAnswer
)


class PrimaryKeyInline(admin.TabularInline):
    model = PrimaryKey
    extra = 0


class StudentTestSessionLogInline(admin.TabularInline):
    model = StudentTestSessionLog
    extra = 0
    readonly_fields = ('timestamp',)


class StudentAnswerInline(admin.TabularInline):
    model = StudentAnswer
    extra = 0


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher', 'course', 'start_time', 'end_time', 'duration', 'frequency', 'primary_keys_count')
    list_filter = ('frequency', 'start_time', 'end_time', 'teacher', 'course')
    search_fields = ('name', 'description', 'teacher__username', 'course__title')
    readonly_fields = ('duration',)
    inlines = [PrimaryKeyInline]
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'teacher', 'course')
        }),
        ('Test Configuration', {
            'fields': ('pdf_file', 'frequency')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'duration')
        }),
    )
    
    def primary_keys_count(self, obj):
        return obj.primary_keys.count()
    primary_keys_count.short_description = 'Answer Keys'


@admin.register(PrimaryKey)
class PrimaryKeyAdmin(admin.ModelAdmin):
    list_display = ('test', 'question_number', 'answer')
    list_filter = ('test',)
    search_fields = ('test__name',)
    ordering = ('test', 'question_number')


@admin.register(StudentTestSession)
class StudentTestSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'test', 'status', 'entry_time', 'end_time', 'exit_time', 'is_expired_status', 'device_id')
    list_filter = ('status', 'entry_time', 'end_time', 'test')
    search_fields = ('user__username', 'user__email', 'test__name', 'device_id', 'ip_address')
    readonly_fields = ('entry_time', 'is_expired_status')
    inlines = [StudentTestSessionLogInline, StudentAnswerInline]
    list_per_page = 25
    
    fieldsets = (
        ('Session Information', {
            'fields': ('user', 'test', 'status')
        }),
        ('Timing', {
            'fields': ('entry_time', 'end_time', 'exit_time', 'is_expired_status')
        }),
        ('Device Information', {
            'fields': ('device_id', 'ip_address', 'user_agent')
        }),
    )
    
    def is_expired_status(self, obj):
        return obj.is_expired()
    is_expired_status.boolean = True
    is_expired_status.short_description = 'Expired'


@admin.register(StudentTestSessionLog)
class StudentTestSessionLogAdmin(admin.ModelAdmin):
    list_display = ('session', 'action', 'timestamp', 'device_id', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('session__user__username', 'session__test__name', 'device_id', 'ip_address')
    readonly_fields = ('timestamp',)
    list_per_page = 50


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('session', 'question_number', 'answer', 'user', 'test')
    list_filter = ('session__test', 'question_number')
    search_fields = ('session__user__username', 'session__test__name')
    ordering = ('session', 'question_number')
    
    def user(self, obj):
        return obj.session.user.username
    user.short_description = 'User'
    
    def test(self, obj):
        return obj.session.test.name
    test.short_description = 'Test'
