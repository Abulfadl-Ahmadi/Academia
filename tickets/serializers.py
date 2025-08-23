from rest_framework import serializers
from .models import Ticket, TicketResponse, TicketAttachment, AIConversation, AIMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class TicketAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketAttachment
        fields = ['id', 'file', 'uploaded_at']


class TicketResponseSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(max_length=None, allow_empty_file=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = TicketResponse
        fields = ['id', 'user', 'content', 'created_at', 'attachments', 'uploaded_files']
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        
        ticket_response = TicketResponse.objects.create(**validated_data)
        
        for file in uploaded_files:
            TicketAttachment.objects.create(
                response=ticket_response,
                file=file
            )
        
        return ticket_response


class TicketSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)
    responses = TicketResponseSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(max_length=None, allow_empty_file=False),
        write_only=True,
        required=False
    )
    assigned_to_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'created_by', 'assigned_to', 
            'status', 'priority', 'category', 'created_at', 'updated_at',
            'responses', 'attachments', 'status_display', 'priority_display',
            'category_display', 'uploaded_files', 'assigned_to_id'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        
        validated_data['created_by'] = self.context['request'].user
        
        if assigned_to_id:
            try:
                validated_data['assigned_to'] = User.objects.get(id=assigned_to_id)
            except User.DoesNotExist:
                pass
        
        ticket = Ticket.objects.create(**validated_data)
        
        for file in uploaded_files:
            TicketAttachment.objects.create(
                ticket=ticket,
                file=file
            )
        
        return ticket

    def update(self, instance, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        
        if assigned_to_id:
            try:
                instance.assigned_to = User.objects.get(id=assigned_to_id)
            except User.DoesNotExist:
                pass
        
        # Update ticket fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Add new attachments
        for file in uploaded_files:
            TicketAttachment.objects.create(
                ticket=instance,
                file=file
            )
        
        return instance


class AIMessageSerializer(serializers.ModelSerializer):
    """سریالایزر پیام های هوش مصنوعی"""
    
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['created_at']


class AIConversationSerializer(serializers.ModelSerializer):
    """سریالایزر گفتگوهای هوش مصنوعی"""
    messages = AIMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = AIConversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages']
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        """ایجاد گفتگوی جدید"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AIConversationListSerializer(serializers.ModelSerializer):
    """سریالایزر لیست گفتگوهای هوش مصنوعی"""
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AIConversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'last_message', 'message_count']
        read_only_fields = ['created_at', 'updated_at', 'last_message', 'message_count']
    
    def get_last_message(self, obj):
        """آخرین پیام گفتگو"""
        last_message = obj.messages.order_by('created_at').last()
        if last_message:
            return {
                'role': last_message.role,
                'content': last_message.content[:100] + ('...' if len(last_message.content) > 100 else ''),
                'created_at': last_message.created_at
            }
        return None
    
    def get_message_count(self, obj):
        """تعداد پیام های گفتگو"""
        return obj.messages.count()
