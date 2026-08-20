from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Subject, Chapter, Section, Lesson, TopicCategory, Topic, StudentTopicProgress


class ChapterInline(TabularInline):
    model = Chapter
    extra = 1
    fields = ['name', 'order', 'description']


class SectionInline(TabularInline):
    model = Section
    extra = 1
    fields = ['name', 'order', 'description']


class LessonInline(TabularInline):
    model = Lesson
    extra = 1
    fields = ['name', 'order', 'description']


class TopicCategoryInline(TabularInline):
    model = TopicCategory
    extra = 1
    fields = ['name', 'order', 'description']


class TopicInline(TabularInline):
    model = Topic
    extra = 1
    fields = ['name', 'order', 'difficulty', 'estimated_study_time']


@admin.register(Subject)
class SubjectAdmin(ModelAdmin):
    list_display = ['name', 'grade', 'is_active', 'get_total_topics', 'created_at']
    list_filter = ['grade', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    inlines = [ChapterInline]
    
    def get_total_topics(self, obj):
        return obj.get_total_topics()
    get_total_topics.short_description = 'تعداد مباحث'


@admin.register(Chapter)
class ChapterAdmin(ModelAdmin):
    list_display = ['name', 'subject', 'order', 'get_total_topics']
    list_filter = ['subject', 'created_at']
    search_fields = ['name', 'description', 'subject__name']
    ordering = ['subject', 'order']
    inlines = [SectionInline]
    
    def get_total_topics(self, obj):
        return obj.get_total_topics()
    get_total_topics.short_description = 'تعداد مباحث'


@admin.register(Section)
class SectionAdmin(ModelAdmin):
    list_display = ['name', 'chapter', 'order', 'lessons_count']
    list_filter = ['chapter__subject', 'chapter', 'created_at']
    search_fields = ['name', 'description', 'chapter__name']
    ordering = ['chapter', 'order']
    inlines = [LessonInline]
    
    def lessons_count(self, obj):
        return obj.lessons.count()
    lessons_count.short_description = 'تعداد درس‌ها'


@admin.register(Lesson)
class LessonAdmin(ModelAdmin):
    list_display = ['name', 'section', 'order', 'topic_categories_count']
    list_filter = ['section__chapter__subject', 'section__chapter', 'section', 'created_at']
    search_fields = ['name', 'description', 'section__name']
    ordering = ['section', 'order']
    inlines = [TopicCategoryInline]
    
    def topic_categories_count(self, obj):
        return obj.topic_categories.count()
    topic_categories_count.short_description = 'تعداد دسته‌های موضوع'


@admin.register(TopicCategory)
class TopicCategoryAdmin(ModelAdmin):
    list_display = ['name', 'lesson', 'order', 'topics_count']
    list_filter = ['lesson__section__chapter__subject', 'lesson__section__chapter', 'lesson__section', 'lesson', 'created_at']
    search_fields = ['name', 'description', 'lesson__name']
    ordering = ['lesson', 'order']
    inlines = [TopicInline]
    
    def topics_count(self, obj):
        return obj.topics.count()
    topics_count.short_description = 'تعداد مباحث'


@admin.register(Topic)
class TopicAdmin(ModelAdmin):
    list_display = [
        'name', 'topic_category', 'order', 'difficulty', 
        'estimated_study_time', 'get_available_tests_count'
    ]
    list_filter = [
        'difficulty', 'topic_category__lesson__section__chapter__subject', 
        'topic_category__lesson__section__chapter', 'created_at'
    ]
    search_fields = ['name', 'description', 'tags']
    filter_horizontal = ['prerequisites']
    ordering = ['topic_category', 'order']
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('name', 'topic_category', 'order', 'description')
        }),
        ('تنظیمات', {
            'fields': ('difficulty', 'estimated_study_time', 'tags')
        }),
        ('پیش‌نیازها', {
            'fields': ('prerequisites',),
            'classes': ('collapse',)
        })
    )
    
    def get_available_tests_count(self, obj):
        return obj.get_available_tests_count()
    get_available_tests_count.short_description = 'تعداد آزمون‌ها'


@admin.register(StudentTopicProgress)
class StudentTopicProgressAdmin(ModelAdmin):
    list_display = [
        'student', 'topic', 'tests_taken', 'skill_level', 
        'is_mastered', 'last_attempt'
    ]
    list_filter = [
        'is_mastered', 'topic__difficulty', 
        'topic__topic_category__lesson__section__chapter__subject', 'mastery_date'
    ]
    search_fields = [
        'student__username', 'student__first_name', 'student__last_name',
        'topic__name'
    ]
    readonly_fields = ['first_attempt', 'last_attempt', 'average_score']
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('student', 'topic')
        }),
        ('آمار عملکرد', {
            'fields': (
                'tests_taken', 'total_score', 'best_score', 
                'skill_level', 'average_score'
            )
        }),
        ('وضعیت تسلط', {
            'fields': ('is_mastered', 'mastery_date')
        }),
        ('تاریخ‌ها', {
            'fields': ('first_attempt', 'last_attempt'),
            'classes': ('collapse',)
        })
    )
