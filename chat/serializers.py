from rest_framework import serializers
from .models import AIConversation, AIMessage, AIAttachment, UserSubscription


class AIAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAttachment
        fields = ['id', 'file', 'attachment_type', 'original_name', 'file_size', 'page_count', 'created_at']


class AIMessageSerializer(serializers.ModelSerializer):
    attachments = AIAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'model_tier', 'model_name', 'reasoning', 'tokens_used', 'created_at', 'attachments']
        read_only_fields = ['created_at']


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = ['id', 'title', 'is_pinned', 'created_at', 'updated_at', 'messages']
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AIConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = AIConversation
        fields = ['id', 'title', 'is_pinned', 'created_at', 'updated_at', 'last_message', 'message_count']
        read_only_fields = ['created_at', 'updated_at', 'last_message', 'message_count']

    def get_last_message(self, obj):
        last_message = obj.messages.order_by('created_at').last()
        if last_message:
            return {
                'role': last_message.role,
                'content': last_message.content[:100] + ('...' if len(last_message.content) > 100 else ''),
                'created_at': last_message.created_at
            }
        return None

    def get_message_count(self, obj):
        return obj.messages.count()


class UserSubscriptionSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    usage = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    quota = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = ['id', 'tier', 'tier_display', 'is_active', 'expires_at', 'usage', 'remaining', 'quota']
        read_only_fields = ['id', 'tier', 'is_active', 'expires_at', 'usage', 'remaining', 'quota']

    def get_usage(self, obj):
        return obj.get_usage()

    def get_remaining(self, obj):
        return obj.get_remaining()

    def get_quota(self, obj):
        quota = obj.get_quota()
        # Remove internal keys not needed by frontend
        return {
            'max_tier': quota['max_tier'],
            'tier1_daily': quota['tier1_daily'],
            'tier2_daily': quota['tier2_daily'],
            'tier3_daily': quota['tier3_daily'],
            'pdf_daily': quota['pdf_daily'],
            'pdf_max_pages': quota['pdf_max_pages'],
            'image_daily': quota['image_daily'],
            'image_max_size_mb': quota['image_max_size_mb'],
            'context_window': quota['context_window'],
            'max_file_size_mb': quota['max_file_size_mb'],
        }