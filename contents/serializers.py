from rest_framework import serializers
from .models import File
from utils.vod import create_upload_url
from courses.serializers import CourseSerializer
from utils.vod import get_video_player_url


class FileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    player_url = serializers.SerializerMethodField()
    course = serializers.PrimaryKeyRelatedField(queryset=File._meta.get_field('course').related_model.objects.all())
    course_info = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = File
        fields = [
            'id',
            'file',
            'file_url', 'file_type', 'content_type', 'file_id', 'player_url',
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
        # return ""
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        elif obj.arvan_url:
            return obj.arvan_url
        return ""
    
    def get_player_url(self, obj):
        if obj.file_type == 'video/mp4' and obj.file_id:
            return get_video_player_url(obj.file_id)
        return ""

    def get_file_type(self, file):
        if file:
            return file.file_type if file.file_type else 'application/pdf'
        else:
            return 'video/mp4'
        
    def update(self, instance, validated_data):
        # فقط اگر فایل جدید فرستاده شده بود، آپدیت کن
        if 'file' in validated_data and validated_data['file'] is not None:
            instance.file = validated_data.get('file')

        # بقیه فیلدها رو آپدیت کن
        for attr, value in validated_data.items():
            if attr != 'file':
                setattr(instance, attr, value)

        instance.save()
        return instance
    

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



class VideoInitUploadSerializer(serializers.Serializer):
    title = serializers.CharField()
    channel_id = serializers.CharField()
    # filesize = serializers.CharField()
    file_type = serializers.CharField(default="video/mp4")  # Assuming video uploads are always mp4

class VideoFinalizeSerializer(serializers.Serializer):
    file_id = serializers.CharField()
    channel_id = serializers.CharField()
    title = serializers.CharField()
    course = serializers.IntegerField(required=False)
    session = serializers.IntegerField(required=False)
