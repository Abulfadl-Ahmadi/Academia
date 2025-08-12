import uuid
from rest_framework import generics, permissions, views
from rest_framework.response import Response
from rest_framework import status
from .models import File
from .serializers import FileSerializer, FileUploadSerializer, VideoInitUploadSerializer, VideoFinalizeSerializer
from utils.vod import upload_video_file, create_video, create_upload_url, get_video
from utils.vod2 import create_upload_url as create_presigned_upload_url
import logging
from time import sleep

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class FileListCreateView(generics.ListCreateAPIView):
    queryset = File.objects.all().order_by('-created_at').select_related('course')
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        file_id = self.request.data.get('file_id') or str(uuid.uuid4())
        serializer.save(file_id=file_id)

    def get_queryset(self):
        queryset = super().get_queryset()
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        return queryset

class FileRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]


class VideoUploadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = FileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_type = serializer.validated_data['file_type']
            # file_path = request.FILES['file'].temporary_file_path()
            file_id = request.data.get('file_id')  # Generate a unique file_id
            course_id = request.data.get('course')
            session_id = request.data.get('session')
            title = serializer.validated_data['title']

                # Video: Upload to ArvanCloud
                # upload_response = serializer.save()
                # upload_url = upload_response['location']
                # file_id = upload_response['file_id']
                # logger.debug(f"Starting video upload: URL={upload_url}, File={file_path}")
                # upload_result = upload_video_file(upload_url, file_path, serializer.validated_data['channel_id'])
                
                # # Create video object on ArvanCloud
                # video_response = create_video(
                #     channel_id=serializer.validated_data['channel_id'],
                #     file_id=file_id,
                #     title=title
                # )
                # print(f"Video created: {video_response}")
                
                # Save metadata to database without storing the file
            file_instance = File.objects.create(
                file_id=file_id,
                file_type=file_type,
                title=title,
                course_id=course_id,
                session_id=session_id,
                # arvan_url=upload_result  # Store ArvanCloud URL (add this field to the File model)
            )
            
            return Response({
                'id': file_instance.id,
                'file_id': file_instance.file_id,
                # 'video_data': video_response,
                # 'file_url': upload_result,  # Return ArvanCloud URL
            }, status=status.HTTP_201_CREATED)


        except Exception as e:
            logger.error(f"Upload failed: {str(e)}", exc_info=True)
            return Response({'error': f"Upload failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)



class VideoInitUploadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VideoInitUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_name = serializer.validated_data['title']
        title = file_name
        channel_id = serializer.validated_data['channel_id']
        # filesize = serializer.validated_data['filesize']
        file_id = str(uuid.uuid4())

        try:
            # upload_data = create_upload_url(channel_id=channel_id, filename=title,file_size=filesize, file_type="video/mp4")
            upload_data = create_presigned_upload_url(
                channel_id=serializer.validated_data['channel_id'],
                file_name=serializer.validated_data['title'],
                file_type=serializer.validated_data['file_type']
            )
            return Response({
                # "upload_url": upload_data["location"],
                "upload_url": upload_data["upload_link"],
                "file_id": upload_data["file_id"],
                
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 2. Finalize video after frontend TUS upload
class VideoFinalizeUploadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VideoFinalizeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            video_data = get_video(serializer.validated_data["file_id"])
            # print("GETING PLAYER URL", end="")
            # while True:
            #     sleep(100)
            #     if video_data["data"].get("player_url"): 
            #         break
            #     video_data = get_video(serializer.validated_data["file_id"])
            # print("\tDONE")
            print(video_data["data"].get('player_url'))


            file = File.objects.create(
                file_id=serializer.validated_data["file_id"],
                title=serializer.validated_data["title"],
                file_type='video/mp4',
                arvan_url=video_data["data"].get("player_url"),
                course_id=serializer.validated_data.get("course"),
                session_id=serializer.validated_data.get("session"),
            )

            return Response({
                "video_id": video_data.get("id"),
                "file_url": video_data.get("player_url"),
                "embed_code": video_data.get("embed_code"),
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
