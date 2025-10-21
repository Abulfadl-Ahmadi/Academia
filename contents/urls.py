from django.urls import path, include
from .views import (
    FileListCreateView, FileRetrieveUpdateDeleteView, VideoUploadView, 
    VideoInitUploadView, VideoFinalizeUploadView,
    GalleryImageViewSet, PublicGalleryImageListView, PublicGalleryImageDetailView,
    OfficialBookViewSet
)
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'files', FileListCreateView, basename='files')
router.register(r'gallery-images', GalleryImageViewSet, basename='gallery-images')
router.register(r'official-books', OfficialBookViewSet, basename='official-books')



urlpatterns = [
    path('', include(router.urls)),
    # path('files/<int:pk>/', FileRetrieveUpdateDeleteView.as_view(), name='file-detail'),
    path('video/create/', VideoUploadView.as_view(), name='video-create'),
    path('videos/upload/', VideoUploadView.as_view(), name='video-upload'),
    path('videos/init-upload/', VideoInitUploadView.as_view()),
    path('videos/finalize/', VideoFinalizeUploadView.as_view()),
    
    # Public gallery endpoints
    path('gallery/images/', PublicGalleryImageListView.as_view(), name='public-gallery-list'),
    path('gallery/images/<int:pk>/', PublicGalleryImageDetailView.as_view(), name='public-gallery-detail'),
]
