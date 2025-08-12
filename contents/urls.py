from django.urls import path
from .views import FileListCreateView, FileRetrieveUpdateDeleteView, VideoUploadView, VideoInitUploadView, VideoFinalizeUploadView

urlpatterns = [
    path('files/', FileListCreateView.as_view(), name='file-list-create'),
    path('files/<int:pk>/', FileRetrieveUpdateDeleteView.as_view(), name='file-detail'),
    path('video/create/', VideoUploadView.as_view(), name='video-create'),
    path('videos/upload/', VideoUploadView.as_view(), name='video-upload'),
    path('videos/init-upload/', VideoInitUploadView.as_view()),
    path('videos/finalize/', VideoFinalizeUploadView.as_view()),
]
