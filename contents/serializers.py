from rest_framework import serializers
from .models import File
from utils.vod import create_upload_url
from utils.vod import get_video_player_url
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)


class FileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    # player_url = serializers.SerializerMethodField()
    # Make course optional (tests / standalone PDFs may not belong to a course)
    course = serializers.PrimaryKeyRelatedField(
        queryset=File._meta.get_field('course').related_model.objects.all(),
        required=False,
        allow_null=True
    )
    course_info = serializers.SerializerMethodField(read_only=True)
    file_id = serializers.CharField(read_only=True)
    class Meta:
        model = File
        fields = [
            'id',
            'file',
            'file_url', 'file_type', 'content_type', 'file_id',
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
    
    # def get_player_url(self, obj):
    #     if obj.file_type == 'video/mp4' and obj.file_id:
    #         return get_video_player_url(obj.file_id)
    #     return ""

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

    def create(self, validated_data):
        """Override create to surface storage (e.g. S3) errors as validation errors instead of 500."""
        try:
            return super().create(validated_data)
        except ClientError as e:
            # Provide a cleaner message to the client
            code = getattr(e, 'response', {}).get('Error', {}).get('Code')
            msg = getattr(e, 'response', {}).get('Error', {}).get('Message')
            logger.error("S3 ClientError during file save", exc_info=True, extra={
                'error_code': code,
                'error_message': msg,
                'operation': 'upload'
            })
            raise serializers.ValidationError({'file': f'Storage upload failed ({code}): {msg}'})
        except Exception as e:  # Fallback generic error
            logger.error("Generic storage error during file save", exc_info=True)
            raise serializers.ValidationError({'file': f'Storage upload failed: {str(e)}'})
    

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
