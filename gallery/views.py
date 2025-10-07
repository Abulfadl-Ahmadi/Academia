from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import uuid
import logging
from django.shortcuts import render
from .models import GalleryImage
from .serializers import GalleryImageSerializer, PublicGalleryImageSerializer

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class GalleryImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing gallery images.
    Similar to FileListCreateView in contents app.
    """
    queryset = GalleryImage.objects.all().order_by('-created_at')
    serializer_class = GalleryImageSerializer
    permission_classes = [permissions.IsAuthenticated]  # Restore authentication when ready
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def perform_create(self, serializer):
        """Handle creating new gallery images with logging"""
        logger.info(f"Creating gallery image with data: {self.request.data}")
        logger.info(f"Files: {self.request.FILES}")
        serializer.save()
        logger.info(f"Gallery image created successfully")
    
    def get_queryset(self):
        """Filter images based on query parameters"""
        queryset = super().get_queryset()
        is_published = self.request.query_params.get('is_published')
        if is_published is not None:
            queryset = queryset.filter(is_published=is_published.lower() == 'true')
        return queryset


class PublicGalleryImageDetailView(APIView):
    """
    Public API for fetching a single published gallery image by ID.
    This endpoint handles: /api/gallery/images/{id}/
    """
    permission_classes = [AllowAny]
    
    def get_gallery_image(self, pk):
        """Helper method to get a single published gallery image"""
        try:
            gallery_image = GalleryImage.objects.get(pk=pk, is_published=True)
            serializer = PublicGalleryImageSerializer(gallery_image)
            return Response(serializer.data)
        except GalleryImage.DoesNotExist:
            return Response(
                {"detail": "Gallery image not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def get(self, request, pk, *args, **kwargs):
        """Handle GET requests for individual gallery image"""
        return self.get_gallery_image(pk)
    
    def post(self, request, pk, *args, **kwargs):
        """Handle POST requests the same as GET for compatibility"""
        return self.get_gallery_image(pk)
    
    def delete(self, request, pk, *args, **kwargs):
        """Handle DELETE requests - for public API, just return the image data"""
        # For public API, we don't actually delete, just return the image data
        # This maintains compatibility while keeping public data safe
        return self.get_gallery_image(pk)
    
    def put(self, request, pk, *args, **kwargs):
        """Handle PUT requests the same as GET for compatibility"""
        return self.get_gallery_image(pk)
    
    def patch(self, request, pk, *args, **kwargs):
        """Handle PATCH requests the same as GET for compatibility"""
        return self.get_gallery_image(pk)


class PublicGalleryImageListView(APIView):
    """
    Public API for fetching published gallery images.
    This endpoint matches the frontend expectation: /api/gallery/images/
    Handles multiple HTTP methods for compatibility
    """
    permission_classes = [AllowAny]
    
    def get_gallery_images(self):
        """Helper method to get published gallery images"""
        queryset = GalleryImage.objects.filter(is_published=True).order_by('order', '-created_at')
        serializer = PublicGalleryImageSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def get(self, request, *args, **kwargs):
        """Handle GET requests"""
        return self.get_gallery_images()
    
    def post(self, request, *args, **kwargs):
        """Handle POST requests the same as GET for compatibility"""
        return self.get_gallery_images()
    
    def put(self, request, *args, **kwargs):
        """Handle PUT requests the same as GET for compatibility"""
        return self.get_gallery_images()
    
    def patch(self, request, *args, **kwargs):
        """Handle PATCH requests the same as GET for compatibility"""
        return self.get_gallery_images()
    
    def delete(self, request, *args, **kwargs):
        """Handle DELETE requests the same as GET for compatibility"""
        return self.get_gallery_images()
