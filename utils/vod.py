# utils/vod.py
import requests
from decouple import config
# from tusclient import client as tuspy
import base64
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

VOD_API_KEY = config('VOD_API_KEY')
VOD_BASE_URL = config('VOD_BASE_URL')

def create_channel(req):
    """
    Create a new channel on ArvanCloud Video Platform.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "title": req.get('title'),
    }

    logger.debug(f"Creating channel with data: {data}")
    
    try:
        response = requests.post(f"{VOD_BASE_URL}/channels", json=data, headers=headers, timeout=30)
        
        if response.status_code == 201:
            return response.json()
        else:
            logger.error(f"Failed to create channel: HTTP {response.status_code} - {response.text}")
            raise Exception(f"Failed to create VOD channel: HTTP {response.status_code} - {response.reason}")
    except requests.exceptions.Timeout:
        logger.error("VOD API request timed out")
        raise Exception("VOD service is temporarily unavailable (timeout)")
    except requests.exceptions.ConnectionError:
        logger.error("Failed to connect to VOD service")
        raise Exception("Unable to connect to VOD service")
    except Exception as e:
        logger.error(f"Unexpected error creating VOD channel: {str(e)}")
        raise Exception(f"VOD service error: {str(e)}")

def delete_channel(channel_id):
    """
    Delete a channel on ArvanCloud Video Platform.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }

    logger.debug(f"Deleting channel: {channel_id}")
    
    try:
        response = requests.delete(f"{VOD_BASE_URL}/channels/{channel_id}", headers=headers, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Failed to delete channel: HTTP {response.status_code} - {response.text}")
            raise Exception(f"Failed to delete VOD channel: HTTP {response.status_code} - {response.reason}")
    except requests.exceptions.Timeout:
        logger.error("VOD API request timed out")
        raise Exception("VOD service is temporarily unavailable (timeout)")
    except requests.exceptions.ConnectionError:
        logger.error("Failed to connect to VOD service")
        raise Exception("Unable to connect to VOD service")
    except Exception as e:
        logger.error(f"Unexpected error deleting VOD channel: {str(e)}")
        raise Exception(f"VOD service error: {str(e)}")

def create_upload_url(channel_id, file_size, filename, file_type):
    """
    Generate a TUS upload URL for a video file.
    """
    def encode_metadata(value):
        return base64.b64encode(value.encode('utf-8')).decode('utf-8')

    metadata = {
        "filename": encode_metadata(filename),
        "filetype": encode_metadata(file_type),
    }
    upload_metadata = ",".join(f"{key} {value}" for key, value in metadata.items())

    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
        "tus-resumable": "1.0.0",
        "upload-length": str(file_size),
        "upload-metadata": upload_metadata,
    }

    url = f"{VOD_BASE_URL}/channels/{channel_id}/files"
    logger.debug(f"Creating upload URL with headers: {headers}, URL: {url}")
    response = requests.post(url, headers=headers)

    if response.status_code == 201:
        upload_url = response.headers.get("Location")
        logger.debug(f"Upload URL created: {upload_url}")
        return {
            "location": upload_url,
            "file_id": upload_url.split("/")[-1] if upload_url else None
        }
    else:
        logger.error(f"Failed to create upload URL: {response.status_code} - {response.text}")
        raise Exception(f"Failed to create upload URL: {response.text}")

def upload_video_file(upload_url, file_path, channel_id):
    """
    Uploads a video file to the specified TUS URL.
    """
    logger.debug(f"Uploading video to URL: {upload_url}, File: {file_path}")
    try:
        # HEAD request to validate the URL is fine as it is.
        head_response = requests.head(upload_url, headers={
            "Authorization": f"Apikey {VOD_API_KEY}",
            "Tus-Resumable": "1.0.0"
        })
        if head_response.status_code not in [200, 204]:
            logger.error(f"Upload URL validation failed: {head_response.status_code} - {head_response.text}")
            raise Exception(f"Invalid upload URL: {head_response.status_code}")

        # 1. Create a TusClient instance with the necessary headers.
        #    The 'tuspy' alias refers to the 'client' module. The class is 'TusClient'.
        # my_client = tuspy.TusClient(f"{VOD_BASE_URL}/channels/{channel_id}/files",
        #     headers={
        #         "Authorization": f"Apikey {VOD_API_KEY}",
        #         "Accept-Language": "en",
        #         "Accept": "application/json",
        #     }
        # )

        # 2. Create the uploader from the client, providing the pre-generated upload URL.
        #    The uploader will use the headers from `my_client`.
        # uploader = my_client.uploader(
        #     file_path,
        #     url=upload_url,
        #     chunk_size=1 * 1024 * 1024,  # 1MB chunks
        #     metadata={
        #         "filename": file_path.split("/")[-1],
        #         "filetype": "video/mp4"
        #     }
        # )

        # logger.debug(f"Starting TUS upload to: {uploader.url}")
        # uploader.upload()
        # logger.debug(f"Video uploaded successfully to: {uploader.url}")
        
        # return uploader.url
        raise NotImplementedError("tusclient module not installed")

    except Exception as e:
        logger.error(f"Failed to upload video: {str(e)}")
        # Re-raise the exception to be handled by the calling view
        raise Exception(f"Failed to upload video: {str(e)}")

def get_video(file_id):
    """
    Retrieve video metadata from ArvanCloud Video Platform.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }
    response = requests.get(
        f"{VOD_BASE_URL}/videos/{file_id}",
        headers=headers
    )
    print(f"{VOD_BASE_URL}/videos/{file_id}")
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return None
    else:
        logger.error(f"Failed to retrieve video: {response.status_code} - {response.text}")
        raise Exception(f"Failed to retrieve video: {response.text}")
        

def create_video(channel_id, file_id, title, convert_mode="auto"):
    """
    Finalize video upload by creating a video object with metadata.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "title": title,
        "file_id": file_id,
        "convert_mode": convert_mode
    }

    logger.debug(f"Creating video with data: {data}")
    response = requests.post(
        f"{VOD_BASE_URL}/channels/{channel_id}/videos",
        json=data,
        headers=headers
    )

    if response.status_code == 201:
        return response.json()
    else:
        logger.error(f"Failed to create video: {response.status_code} - {response.text}")
        raise Exception(f"Failed to create video: {response.text}")
    

def get_video_player_url(file_id):
    video = get_video(file_id)
    return video.get("data", {}).get("player_url", "") if video else ""


def create_stream(course_title, course_id, max_retries=3):
    """
    Create a live stream for a course on ArvanCloud with retry logic.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }
    
    # Generate a unique slug for the stream
    import re
    slug = re.sub(r'[^a-zA-Z0-9]', '', course_title.lower())[:50] + f"_{course_id}"
    if len(slug) > 50:
        slug = slug[:50]
    
    data = {
        "title": f"Live Stream - {course_title}",
        "description": f"Live streaming for course: {course_title}",
        "type": "normal",
        "mode": "push",  # Push mode for RTMP streaming
        "slug": slug,
        "fps": 30,
        "convert_info": [
            {
                "audio_bitrate": 128,
                "video_bitrate": 1000,
                "resolution_width": 1280,
                "resolution_height": 720
            }
        ],
        "archive_enabled": False,
        "catchup_enabled": False,
        "secure_link_enabled": False
    }

    logger.debug(f"Creating stream with data: {data}")
    
    import time
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to create stream (attempt {attempt + 1}/{max_retries})")
            
            # Increase timeout for stream creation as it might take longer
            response = requests.post(f"{VOD_BASE_URL}/streams", json=data, headers=headers, timeout=60)
            
            if response.status_code == 201:
                stream_data = response.json()
                logger.info(f"Successfully created stream {stream_data.get('data', {}).get('id')} for course {course_title}")
                return stream_data
            elif response.status_code == 504:
                logger.warning(f"Gateway timeout on attempt {attempt + 1}: HTTP {response.status_code}")
                if attempt < max_retries - 1:
                    # Wait before retrying (exponential backoff)
                    wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                    logger.info(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    raise Exception(f"Failed to create live stream after {max_retries} attempts: HTTP {response.status_code} - Gateway Time-out")
            else:
                logger.error(f"Failed to create stream: HTTP {response.status_code} - {response.text}")
                raise Exception(f"Failed to create live stream: HTTP {response.status_code} - {response.reason}")
                
        except requests.exceptions.Timeout:
            logger.warning(f"Request timeout on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5
                logger.info(f"Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
                continue
            else:
                raise Exception("Stream service is temporarily unavailable (timeout after retries)")
        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to stream service")
            raise Exception("Unable to connect to stream service")
        except Exception as e:
            logger.error(f"Unexpected error creating stream: {str(e)}")
            raise Exception(f"Stream service error: {str(e)}")
    
    # This should not be reached, but just in case
    raise Exception("Failed to create stream after all retries")


def delete_stream(stream_id):
    """
    Delete a live stream from ArvanCloud.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }

    logger.debug(f"Deleting stream: {stream_id}")
    
    try:
        response = requests.delete(f"{VOD_BASE_URL}/streams/{stream_id}", headers=headers, timeout=30)
        
        if response.status_code == 200:
            logger.info(f"Successfully deleted stream {stream_id}")
            return response.json()
        else:
            logger.error(f"Failed to delete stream: HTTP {response.status_code} - {response.text}")
            raise Exception(f"Failed to delete live stream: HTTP {response.status_code} - {response.reason}")
    except requests.exceptions.Timeout:
        logger.error("Stream API request timed out")
        raise Exception("Stream service is temporarily unavailable (timeout)")
    except requests.exceptions.ConnectionError:
        logger.error("Failed to connect to stream service")
        raise Exception("Unable to connect to stream service")
    except Exception as e:
        logger.error(f"Unexpected error deleting stream: {str(e)}")
        raise Exception(f"Stream service error: {str(e)}")


def get_stream(stream_id):
    """
    Get stream details from ArvanCloud.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }

    logger.debug(f"Getting stream: {stream_id}")
    
    try:
        response = requests.get(f"{VOD_BASE_URL}/streams/{stream_id}", headers=headers, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Failed to get stream: HTTP {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error getting stream {stream_id}: {str(e)}")
        return None