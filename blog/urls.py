from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, TagViewSet, CategoryViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'blog/posts', PostViewSet, basename='blog-posts')
router.register(r'blog/tags', TagViewSet, basename='blog-tags')
router.register(r'blog/categories', CategoryViewSet, basename='blog-categories')
router.register(r'blog/comments', CommentViewSet, basename='blog-comments')

urlpatterns = [
    path('', include(router.urls)),
]
