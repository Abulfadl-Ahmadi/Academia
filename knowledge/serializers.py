from rest_framework import serializers
from .models import Subject, Chapter, Section, Topic, StudentTopicProgress


class TopicSerializer(serializers.ModelSerializer):
    """سریالایزر برای مبحث"""
    available_tests_count = serializers.ReadOnlyField(source='get_available_tests_count')
    
    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'order', 'description', 'difficulty',
            'tags', 'estimated_study_time', 'available_tests_count'
        ]


class SectionSerializer(serializers.ModelSerializer):
    """سریالایزر برای زیربخش"""
    topics = TopicSerializer(many=True, read_only=True)
    topics_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Section
        fields = ['id', 'name', 'order', 'description', 'topics', 'topics_count']
    
    def get_topics_count(self, obj):
        return obj.topics.count()


class ChapterSerializer(serializers.ModelSerializer):
    """سریالایزر برای فصل"""
    sections = SectionSerializer(many=True, read_only=True)
    total_topics = serializers.ReadOnlyField(source='get_total_topics')
    
    class Meta:
        model = Chapter
        fields = ['id', 'name', 'order', 'description', 'sections', 'total_topics']


class SubjectSerializer(serializers.ModelSerializer):
    """سریالایزر برای کتاب درسی"""
    chapters = ChapterSerializer(many=True, read_only=True)
    total_topics = serializers.ReadOnlyField(source='get_total_topics')
    
    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'grade', 'description', 'cover_image', 
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
    section_name = serializers.CharField(source='section.name', read_only=True)
    chapter_name = serializers.CharField(source='section.chapter.name', read_only=True)
    subject_name = serializers.CharField(source='section.chapter.subject.name', read_only=True)
    prerequisites = TopicSerializer(many=True, read_only=True)
    available_tests_count = serializers.ReadOnlyField(source='get_available_tests_count')
    
    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'order', 'description', 'difficulty', 'tags',
            'estimated_study_time', 'section_name', 'chapter_name', 'subject_name',
            'prerequisites', 'available_tests_count'
        ]
