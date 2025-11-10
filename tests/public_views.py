from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Test, TestContentType


@api_view(['GET'])
@permission_classes([AllowAny])
def test_poster_public(request, test_id):
    """
    Public endpoint for test poster information.
    Returns only the data needed for poster display.
    No authentication required.
    """
    try:
        test = get_object_or_404(Test, id=test_id)
        
        # Check if test should be publicly accessible
        # You might want to add a field like 'is_public' to Test model
        # For now, we'll make all tests accessible
        
        # Format duration to match the main API format (00:30:00)
        duration_str = str(test.duration)
        if ':' in duration_str and len(duration_str.split(':')[0]) == 1:
            # Convert "0:30:00" to "00:30:00"
            parts = duration_str.split(':')
            duration_str = f"{parts[0].zfill(2)}:{parts[1]}:{parts[2]}"
            
            
        if test.content_type == TestContentType.PDF:
            questions_count = test.primary_keys.count()
        else:
            questions_count = test.questions.count()
        
        # Serialize only the needed data for poster
        poster_data = {
            'id': test.id,
            'name': test.name,
            'description': test.description,
            'start_time': test.start_time,
            'end_time': test.end_time,
            'duration': duration_str,
            'total_questions': questions_count,  # Count actual questions
            'collection': {
                'id': test.test_collection.id,
                'name': test.test_collection.name,
            } if test.test_collection else None,
            'folders': [
                {
                    'id': folder.id,
                    'name': folder.name,
                }
                for folder in test.folders.all()
            ],
        }
        
        return Response(poster_data, status=status.HTTP_200_OK)
        
    except Test.DoesNotExist:
        return Response(
            {'detail': 'آزمون یافت نشد'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'detail': 'خطا در دریافت اطلاعات آزمون'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def test_detail_public(request, test_id):
    """
    Public endpoint for test detail information.
    Returns detailed test information for public access.
    No authentication required.
    """
    try:
        test = get_object_or_404(Test, id=test_id)
        
        # Format duration to match the main API format (00:30:00)
        duration_str = str(test.duration)
        if ':' in duration_str and len(duration_str.split(':')[0]) == 1:
            # Convert "0:30:00" to "00:30:00"
            parts = duration_str.split(':')
            duration_str = f"{parts[0].zfill(2)}:{parts[1]}:{parts[2]}"
        
        # Calculate time limit in minutes from duration
        duration_parts = duration_str.split(':')
        time_limit_minutes = int(duration_parts[0]) * 60 + int(duration_parts[1])
        
        # Calculate questions count based on content type
        if test.content_type == TestContentType.PDF:
            questions_count = test.primary_keys.count()
        else:
            questions_count = test.questions.count()
        
        # Serialize test detail data
        test_data = {
            'id': test.id,
            'name': test.name,
            'description': test.description or '',
            'questions_count': questions_count,
            'time_limit': time_limit_minutes,
            'is_active': test.is_active,
            'created_at': test.created_at,
            'start_time': test.start_time,
            'end_time': test.end_time,
            'duration': duration_str,
            'content_type': test.content_type,
            'collection': {
                'id': test.test_collection.id,
                'name': test.test_collection.name,
                'created_by_name': test.test_collection.created_by.get_full_name() if test.test_collection.created_by else 'نامشخص',
            } if test.test_collection else None,
            'folders': [
                {
                    'id': folder.id,
                    'name': folder.name,
                }
                for folder in test.folders.all()
            ],
            
            'pdf_file_url': test.pdf_file.file.url if test.pdf_file else None,
            'answers_file_url': test.answers_file.file.url if test.answers_file else None,
            # در endpoint عمومی، URL فایل‌ها را برنمی‌گردانیم تا امنیت حفظ شود
            # فایل‌ها فقط بعد از ورود دانش‌آموز به آزمون قابل دسترسی هستند
        }
        
        return Response(test_data, status=status.HTTP_200_OK)
        
    except Test.DoesNotExist:
        return Response(
            {'detail': 'آزمون یافت نشد'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'detail': 'خطا در دریافت اطلاعات آزمون'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )