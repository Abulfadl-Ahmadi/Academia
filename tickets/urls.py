from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet
from .ai import GeminiAIView, AIConversationViewSet

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'ai/conversations', AIConversationViewSet, basename='ai-conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('ai/answer/', GeminiAIView.as_view(), name='ai-answer'),
]
