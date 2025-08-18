from django.urls import path, include
from .views import FileListCreateView, FileRetrieveUpdateDeleteView, VideoUploadView, VideoInitUploadView, VideoFinalizeUploadView
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'files', FileListCreateView, basename='files')



urlpatterns = [
    path('', include(router.urls)),
    # path('files/<int:pk>/', FileRetrieveUpdateDeleteView.as_view(), name='file-detail'),
    path('video/create/', VideoUploadView.as_view(), name='video-create'),
    path('videos/upload/', VideoUploadView.as_view(), name='video-upload'),
    path('videos/init-upload/', VideoInitUploadView.as_view()),
    path('videos/finalize/', VideoFinalizeUploadView.as_view()),
]
