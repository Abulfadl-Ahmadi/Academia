from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIConversationViewSet, AIStreamView, SubscriptionView

router = DefaultRouter()
router.register(r'ai/conversations', AIConversationViewSet, basename='ai-conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('ai/stream/', AIStreamView.as_view(), name='ai-stream'),
    path('ai/subscription/', SubscriptionView.as_view(), name='ai-subscription'),
]