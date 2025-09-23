from django.contrib import admin
from .models import (
    TestCollection, Test, PrimaryKey, StudentTestSession, 
    StudentTestSessionLog, StudentAnswer, StudentProgress, Question, Option, QuestionImage
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
    list_display = ('name', 'get_test_collection_name', 'teacher', 'start_time', 'end_time', 'is_active', 'participants_count')
    list_filter = ('is_active', 'test_collection', 'start_time', 'end_time', 'teacher')
    search_fields = ('name', 'description', 'teacher__username', 'test_collection__name')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [PrimaryKeyInline]
    list_per_page = 25
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('name', 'description', 'teacher', 'test_collection', 'is_active')
        }),
        ('تنظیمات آزمون', {
            'fields': ('pdf_file', 'frequency')
        }),
        ('زمان‌بندی', {
            'fields': ('start_time', 'end_time', 'duration')
        }),
        ('آمار', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_test_collection_name(self, obj):
        return obj.test_collection.name if obj.test_collection else "بدون مجموعه"
    get_test_collection_name.short_description = "مجموعه آزمون"
    
    def participants_count(self, obj):
        return obj.get_participants_count()
    participants_count.short_description = 'شرکت‌کنندگان'


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


@admin.register(TestCollection)
class TestCollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_by', 'tests_count', 'students_count', 'created_at')
    list_filter = ('is_active', 'created_by', 'created_at')
    search_fields = ('name', 'description', 'created_by__username')
    filter_horizontal = ('courses',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('name', 'description', 'is_active', 'created_by')
        }),
        ('اتصالات', {
            'fields': ('courses',)
        }),
        ('زمان‌بندی', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def tests_count(self, obj):
        return obj.get_total_tests()
    tests_count.short_description = 'تعداد آزمون'
    
    def students_count(self, obj):
        return obj.get_accessible_students().count()
    students_count.short_description = 'تعداد دانش‌آموز'


@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'test_collection', 'progress_display', 'average_score', 'last_activity')
    list_filter = ('test_collection', 'is_completed', 'last_activity')
    search_fields = ('student__username', 'test_collection__name')
    readonly_fields = ('started_at', 'last_activity', 'progress_percentage', 'average_score')
    list_per_page = 50
    
    def progress_display(self, obj):
        return f"{obj.completed_tests}/{obj.test_collection.tests.count()} ({obj.progress_percentage:.1f}%)"
    progress_display.short_description = 'پیشرفت'
    
    actions = ['update_all_progress']
    
    def update_all_progress(self, request, queryset):
        for progress in queryset:
            progress.update_progress()
        self.message_user(request, f"{queryset.count()} پیشرفت بروزرسانی شد.")
    update_all_progress.short_description = "بروزرسانی پیشرفت انتخاب شده‌ها"


class OptionInline(admin.TabularInline):
    model = Option
    extra = 0


class QuestionImageInline(admin.TabularInline):
    model = QuestionImage
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text_short', 'created_by', 'difficulty_level', 'is_active', 'created_at')
    list_filter = ('difficulty_level', 'is_active', 'created_at', 'created_by')
    search_fields = ('question_text', 'created_by__username')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [OptionInline, QuestionImageInline]
    list_per_page = 25

    fieldsets = (
        ('اطلاعات سوال', {
            'fields': ('question_text', 'folders', 'publish_date', 'source')
        }),
        ('گزینه‌ها و پاسخ', {
            'fields': ('correct_option',)
        }),
        ('تنظیمات', {
            'fields': ('difficulty_level', 'detailed_solution', 'is_active')
        }),
        ('مدیریت', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def question_text_short(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text
    question_text_short.short_description = 'متن سوال'


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ('question', 'option_text_short', 'order')
    list_filter = ('question__difficulty_level',)
    search_fields = ('option_text', 'question__question_text')
    list_per_page = 25

    def option_text_short(self, obj):
        return obj.option_text[:50] + '...' if len(obj.option_text) > 50 else obj.option_text
    option_text_short.short_description = 'متن گزینه'


@admin.register(QuestionImage)
class QuestionImageAdmin(admin.ModelAdmin):
    list_display = ('question', 'alt_text', 'order')
    list_filter = ('question__difficulty_level',)
    search_fields = ('alt_text', 'question__question_text')
    list_per_page = 25
