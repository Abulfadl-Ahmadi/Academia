from rest_framework import serializers
from .models import Subject, Chapter, Section, Lesson, TopicCategory, Topic, StudentTopicProgress, Folder


class TopicSerializer(serializers.ModelSerializer):
    """سریالایزر برای مبحث"""
    available_tests_count = serializers.ReadOnlyField(source='get_available_tests_count')
    
    class Meta:
        model = Topic
        fields = [
            'id', 'topic_category', 'name', 'order', 'description', 'difficulty',
            'tags', 'estimated_study_time', 'available_tests_count'
        ]


class FolderSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    path_ids = serializers.ReadOnlyField()
    depth = serializers.ReadOnlyField()

    class Meta:
        model = Folder
        fields = ['id', 'name', 'parent', 'description', 'order', 'depth', 'path_ids', 'children']

    def get_children(self, obj):
        children = obj.children.all().order_by('order', 'id')
        return FolderSerializer(children, many=True, context=self.context).data


class TopicCategorySerializer(serializers.ModelSerializer):
    """سریالایزر برای دسته موضوع"""
    topics = TopicSerializer(many=True, read_only=True)
    topics_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TopicCategory
        fields = ['id', 'lesson', 'name', 'order', 'description', 'topics', 'topics_count']
    
    def get_topics_count(self, obj):
        return obj.topics.count()


class LessonSerializer(serializers.ModelSerializer):
    """سریالایزر برای درس"""
    topic_categories = TopicCategorySerializer(many=True, read_only=True)
    total_topics = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = ['id', 'section', 'name', 'order', 'description', 'topic_categories', 'total_topics']
    
    def get_total_topics(self, obj):
        return Topic.objects.filter(topic_category__lesson=obj).count()


class SectionSerializer(serializers.ModelSerializer):
    """سریالایزر برای زیربخش"""
    lessons = LessonSerializer(many=True, read_only=True)
    total_topics = serializers.SerializerMethodField()
    
    class Meta:
        model = Section
        fields = ['id', 'chapter', 'name', 'order', 'description', 'lessons', 'total_topics']
    
    def get_total_topics(self, obj):
        return Topic.objects.filter(topic_category__lesson__section=obj).count()


class ChapterSerializer(serializers.ModelSerializer):
    """سریالایزر برای فصل"""
    sections = SectionSerializer(many=True, read_only=True)
    total_topics = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = ['id', 'subject', 'name', 'order', 'description', 'sections', 'total_topics']
    
    def get_total_topics(self, obj):
        return Topic.objects.filter(topic_category__lesson__section__chapter=obj).count()


class SubjectSerializer(serializers.ModelSerializer):
    """سریالایزر برای کتاب درسی"""
    chapters = ChapterSerializer(many=True, read_only=True)
    total_topics = serializers.ReadOnlyField(source='get_total_topics')
    book_file_title = serializers.CharField(source='book_file.title', read_only=True)
    book_file_url = serializers.URLField(source='book_file.arvan_url', read_only=True)
    
    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'grade', 'description', 'cover_image', 
            'book_file', 'book_file_title', 'book_file_url',
            'chapters', 'total_topics'
        ]


class StudentTopicProgressSerializer(serializers.ModelSerializer):
    """سریالایزر برای پیشرفت دانش‌آموز در مبحث"""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    average_score = serializers.ReadOnlyField()
    
    class Meta:
        model = StudentTopicProgress
        fields = [
            'id', 'topic', 'topic_name', 'tests_taken', 'total_score',
            'best_score', 'skill_level', 'is_mastered', 'mastery_date',
            'average_score', 'first_attempt', 'last_attempt'
        ]


class TopicTestRequestSerializer(serializers.Serializer):
    """سریالایزر برای درخواست آزمون تصادفی از مبحث"""
    topic_id = serializers.IntegerField()


class KnowledgeTreeSerializer(serializers.ModelSerializer):
    """سریالایزر ساده برای نمایش درخت دانش فشرده"""
    chapters_count = serializers.SerializerMethodField()
    topics_count = serializers.ReadOnlyField(source='get_total_topics')
    
    class Meta:
        model = Subject
        fields = ['id', 'name', 'grade', 'description', 'chapters_count', 'topics_count']
    
    def get_chapters_count(self, obj):
        return obj.chapters.count()


class TopicDetailSerializer(serializers.ModelSerializer):
    """سریالایزر تفصیلی برای مبحث"""
    topic_category_name = serializers.CharField(source='topic_category.name', read_only=True)
    lesson_name = serializers.CharField(source='topic_category.lesson.name', read_only=True)
    section_name = serializers.CharField(source='topic_category.lesson.section.name', read_only=True)
    chapter_name = serializers.CharField(source='topic_category.lesson.section.chapter.name', read_only=True)
    subject_name = serializers.CharField(source='topic_category.lesson.section.chapter.subject.name', read_only=True)
    prerequisites = TopicSerializer(many=True, read_only=True)
    available_tests_count = serializers.ReadOnlyField(source='get_available_tests_count')
    
    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'order', 'description', 'difficulty', 'tags',
            'estimated_study_time', 'topic_category_name', 'lesson_name', 'section_name', 
            'chapter_name', 'subject_name', 'prerequisites', 'available_tests_count'
        ]
