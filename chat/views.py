import json
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import StreamingHttpResponse

from .models import AIConversation, AIMessage, AIAttachment, UserSubscription
from .serializers import (
    AIConversationSerializer,
    AIConversationListSerializer,
    AIMessageSerializer,
    UserSubscriptionSerializer,
)
from .services.model_router import classifier
from .services.llm_provider import generate_response, stream_response, get_model_display
from .services.quotas import TIER_QUOTAS


def get_or_create_subscription(user):
    """Get or create the user's subscription record."""
    sub, created = UserSubscription.objects.get_or_create(user=user)
    return sub


class AIConversationViewSet(viewsets.ModelViewSet):
    """Manage AI conversations."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return AIConversationListSerializer
        return AIConversationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """Pin/unpin a conversation."""
        conversation = self.get_object()
        conversation.is_pinned = not conversation.is_pinned
        conversation.save(update_fields=['is_pinned', 'updated_at'])
        return Response({'is_pinned': conversation.is_pinned})

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        """Send a message and get a non-streaming AI response."""
        conversation = self.get_object()
        content = request.data.get('content', '').strip()

        if not content:
            return Response({'error': 'لطفاً متن پیام را وارد کنید'}, status=status.HTTP_400_BAD_REQUEST)

        # Check subscription & quota
        sub = get_or_create_subscription(request.user)
        if not sub.is_active:
            return Response(
                {'error': 'اشتراک شما منقضی شده است. لطفاً برای تمدید اقدام کنید.', 'code': 'subscription_expired'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Classify query to determine tier
        attachments_meta = request.data.get('attachments', [])
        analysis = classifier.classify(content, attachments_meta, max_tier_override=sub.get_quota()['max_tier'])

        # Check tier quota
        allowed, error = sub.can_use_tier(analysis.tier)
        if not allowed:
            return Response(
                {'error': error, 'code': 'quota_exceeded', 'tier': analysis.tier},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Save user message
        user_message = AIMessage.objects.create(
            conversation=conversation,
            role='user',
            content=content,
            model_tier=analysis.tier,
        )

        # Save attachments if any
        pdf_count = 0
        image_count = 0
        for att in attachments_meta:
            att_type = att.get('type', '')
            if att_type == 'pdf':
                pdf_count += 1
            elif att_type == 'image':
                image_count += 1

        # Get context (last 10 messages)
        previous_messages = list(
            conversation.messages.order_by('-created_at')[:10]
            .values('role', 'content')
        )
        context_messages = list(reversed(previous_messages))

        try:
            # Generate AI response
            result = generate_response(
                question=content,
                context_messages=context_messages,
                tier=analysis.tier,
                attachments=attachments_meta,
            )

            # Save AI message
            ai_message = AIMessage.objects.create(
                conversation=conversation,
                role='assistant',
                content=result['content'],
                model_tier=result['tier'],
                model_name=result['model_name'],
                reasoning=result.get('reasoning'),
                tokens_used=result.get('tokens_used', 0),
            )

            # Update conversation timestamp
            conversation.save(update_fields=['updated_at'])

            # Record usage
            sub.record_usage(tier=analysis.tier, pdf_count=pdf_count, image_count=image_count)

            return Response({
                'user_message': AIMessageSerializer(user_message).data,
                'ai_message': AIMessageSerializer(ai_message).data,
                'tier': analysis.tier,
                'tier_label': analysis.label,
                'model': result['model_name'],
                'provider': result['provider'],
                'remaining': sub.get_remaining(),
                'usage': sub.get_usage(),
            })

        except ConnectionError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"AI API Error: {str(e)}")
            return Response({'error': 'خطا در دریافت پاسخ از هوش مصنوعی'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIStreamView(APIView):
    """Streaming endpoint for AI responses (SSE)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        content = request.data.get('content', '').strip()

        if not content:
            return Response({'error': 'لطفاً متن پیام را وارد کنید'}, status=status.HTTP_400_BAD_REQUEST)

        if not conversation_id:
            return Response({'error': 'شناسه گفتگو الزامی است'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            conversation = AIConversation.objects.get(id=conversation_id, user=request.user)
        except AIConversation.DoesNotExist:
            return Response({'error': 'گفتگو یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        # Check subscription & quota
        sub = get_or_create_subscription(request.user)
        if not sub.is_active:
            return Response(
                {'error': 'اشتراک شما منقضی شده است.', 'code': 'subscription_expired'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Classify query
        attachments_meta = request.data.get('attachments', [])
        analysis = classifier.classify(content, attachments_meta, max_tier_override=sub.get_quota()['max_tier'])

        # Check tier quota
        allowed, error = sub.can_use_tier(analysis.tier)
        if not allowed:
            return Response(
                {'error': error, 'code': 'quota_exceeded', 'tier': analysis.tier},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Save user message
        user_message = AIMessage.objects.create(
            conversation=conversation,
            role='user',
            content=content,
            model_tier=analysis.tier,
        )

        # Count attachments
        pdf_count = sum(1 for a in attachments_meta if a.get('type') == 'pdf')
        image_count = sum(1 for a in attachments_meta if a.get('type') == 'image')

        # Get context
        previous_messages = list(
            conversation.messages.order_by('-created_at')[:10]
            .values('role', 'content')
        )
        context_messages = list(reversed(previous_messages))

        # Record usage immediately (before streaming)
        sub.record_usage(tier=analysis.tier, pdf_count=pdf_count, image_count=image_count)

        def event_stream():
            full_content = ""
            try:
                for chunk in stream_response(
                    question=content,
                    context_messages=context_messages,
                    tier=analysis.tier,
                    attachments=attachments_meta,
                ):
                    data = json.loads(chunk)
                    if data.get('type') == 'delta':
                        full_content += data.get('content', '')
                    elif data.get('type') == 'done':
                        # Save AI message
                        ai_message = AIMessage.objects.create(
                            conversation=conversation,
                            role='assistant',
                            content=full_content,
                            model_tier=analysis.tier,
                            model_name=data.get('model'),
                            tokens_used=0,
                        )
                        conversation.save(update_fields=['updated_at'])
                        data['message_id'] = ai_message.id
                        data['remaining'] = sub.get_remaining()
                        data['usage'] = sub.get_usage()
                    yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
            except Exception as e:
                print(f"Stream error: {str(e)}")
                yield f"data: {json.dumps({'type': 'error', 'message': 'خطا در دریافت پاسخ'}, ensure_ascii=False)}\n\n"

        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream',
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class SubscriptionView(APIView):
    """Get current user's subscription status."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sub = get_or_create_subscription(request.user)
        return Response(UserSubscriptionSerializer(sub).data)