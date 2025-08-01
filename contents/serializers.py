from rest_framework import serializers
from .models import File
from utils.vod import create_upload_url
from courses.serializers import CourseSerializer

class FileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    course = serializers.PrimaryKeyRelatedField(queryset=File._meta.get_field('course').related_model.objects.all())
    course_info = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = File
        fields = [
            'id', 'file', 'file_url', 'file_type',
            'title', 'course', 'course_info', 'session', 'created_at', 'arvan_url'
        ]
        read_only_fields = ['id', 'file_url', 'created_at', 'course_info']

    def get_course_info(self, obj):
        if obj.course:
            return {
                'id': obj.course.id,
                'title': obj.course.title
            }
        return None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        elif obj.arvan_url:
            return obj.arvan_url
        return obj.file.url

    def get_file_type(self, file):
        return file.file_type if file.file_type else 'application/pdf'
    

class FileUploadSerializer(serializers.Serializer):
    channel_id = serializers.CharField()
    title = serializers.CharField()
    filename = serializers.CharField()
    file_size = serializers.IntegerField()
    file_type = serializers.ChoiceField(choices=File.FileType.choices)

    def create(self, validated_data):
        return create_upload_url(
            validated_data['channel_id'],
            validated_data['file_size'],
            validated_data['filename'],
            validated_data['file_type']
        )


