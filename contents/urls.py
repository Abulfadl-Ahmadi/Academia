from django.urls import path
from .views import FileListCreateView, FileRetrieveUpdateDeleteView, VideoUploadView

urlpatterns = [
    path('files/', FileListCreateView.as_view(), name='file-list-create'),
    path('files/<int:pk>/', FileRetrieveUpdateDeleteView.as_view(), name='file-detail'),
    path('videos/upload/', VideoUploadView.as_view(), name='video-upload'),
]
