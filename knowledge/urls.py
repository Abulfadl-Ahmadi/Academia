from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet, ChapterViewSet, SectionViewSet, LessonViewSet, 
    TopicCategoryViewSet, TopicViewSet,
    StudentTopicProgressViewSet, KnowledgeTreeView, TopicRandomTestView,
    FolderViewSet
)

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subjects')
router.register(r'chapters', ChapterViewSet, basename='chapters')
router.register(r'sections', SectionViewSet, basename='sections')
router.register(r'lessons', LessonViewSet, basename='lessons')
router.register(r'topic-categories', TopicCategoryViewSet, basename='topic-categories')
router.register(r'topics', TopicViewSet, basename='topics')
router.register(r'progress', StudentTopicProgressViewSet, basename='student-progress')
router.register(r'folders', FolderViewSet, basename='folders')

urlpatterns = [
    path('', include(router.urls)),
    path('knowledge-tree/', KnowledgeTreeView.as_view(), name='knowledge-tree'),
    path('get-random-test/', TopicRandomTestView.as_view(), name='get-random-test'),
]
