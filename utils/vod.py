# utils/vod.py
import requests
from decouple import config
from tusclient import client as tuspy
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
    response = requests.post(f"{VOD_BASE_URL}/channels", json=data, headers=headers)

    if response.status_code == 201:
        return response.json()
    else:
        logger.error(f"Failed to create channel: {response.status_code} - {response.text}")
        raise Exception(f"Failed to create channel: {response.text}")

def delete_channel(channel_id):
    """
    Delete a channel on ArvanCloud Video Platform.
    """
    headers = {
        "Authorization": f"Apikey {VOD_API_KEY}",
        "Content-Type": "application/json",
    }

    logger.debug(f"Deleting channel: {channel_id}")
    response = requests.delete(f"{VOD_BASE_URL}/channels/{channel_id}", headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"Failed to delete channel: {response.status_code} - {response.text}")
        raise Exception(response.json())

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
        my_client = tuspy.TusClient(f"{VOD_BASE_URL}/channels/{channel_id}/files",
            headers={
                "Authorization": f"Apikey {VOD_API_KEY}",
                "Accept-Language": "en",
                "Accept": "application/json",
            }
        )

        # 2. Create the uploader from the client, providing the pre-generated upload URL.
        #    The uploader will use the headers from `my_client`.
        uploader = my_client.uploader(
            file_path,
            url=upload_url,
            chunk_size=1 * 1024 * 1024,  # 1MB chunks
            metadata={
                "filename": file_path.split("/")[-1],
                "filetype": "video/mp4"
            }
        )

        logger.debug(f"Starting TUS upload to: {uploader.url}")
        uploader.upload()
        logger.debug(f"Video uploaded successfully to: {uploader.url}")
        
        return uploader.url

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
    
