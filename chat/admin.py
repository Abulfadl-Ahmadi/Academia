from django.contrib import admin
from .models import AIConversation, AIMessage, AIAttachment, UserSubscription, ChatMessage


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'is_pinned', 'created_at', 'updated_at']
    list_filter = ['is_pinned', 'created_at']
    search_fields = ['title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'role', 'model_tier', 'model_name', 'tokens_used', 'created_at']
    list_filter = ['role', 'model_tier', 'created_at']
    search_fields = ['content', 'conversation__title', 'conversation__user__username']
    readonly_fields = ['created_at']


@admin.register(AIAttachment)
class AIAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'attachment_type', 'original_name', 'file_size', 'page_count', 'created_at']
    list_filter = ['attachment_type', 'created_at']
    search_fields = ['original_name', 'message__content']


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'tier', 'daily_tier1_used', 'daily_tier2_used', 'daily_tier3_used', 'is_active', 'expires_at']
    list_filter = ['tier', 'last_reset_date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'course', 'user', 'message', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['message', 'user__username', 'course__title']