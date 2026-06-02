from decouple import config
from utils.vod import create_upload_url as create_tus_upload_url
import logging

logger = logging.getLogger(__name__)

VOD_API_KEY = config('VOD_API_KEY')
VOD_BASE_URL = config('VOD_BASE_URL')


def create_upload_url(channel_id: str, file_name: str, file_type: str, file_size: int = None):
    """
    Wrapper that delegates to the main TUS upload URL creator in `utils.vod`.
    Keeps a compatible signature for existing callers but uses the working
    implementation which handles TUS headers and returns the upload location
    and file id.
    """
    try:
        # Prefer passing filesize if available (some implementations need it)
        if file_size:
            return create_tus_upload_url(channel_id=channel_id, file_size=file_size, filename=file_name, file_type=file_type)
        else:
            # Fall back to calling without filesize (some callers don't supply it)
            return create_tus_upload_url(channel_id=channel_id, file_size=0, filename=file_name, file_type=file_type)
    except Exception as e:
        logger.error(f"create_upload_url failed for channel {channel_id}: {e}")
        raise

def create_video(channel_id: str, file_id: str, title: str):
    # This function remains correct
    data = {
        "title": title,
        "channel_id": channel_id,
        "file_id": file_id,
    }
    response = requests.post(f"{VOD_BASE_URL}/videos", headers=HEADERS, json=data)
    if response.status_code == 201:
        return response.json()["data"]
    raise Exception(f"Failed to create video: {response.text}")

def create_video(channel_id: str, file_id: str, title: str):
    data = {
        "title": title,
        "channel_id": channel_id,
        "file_id": file_id,
    }
    response = requests.post(f"{VOD_BASE_URL}/videos", headers=HEADERS, json=data)
    if response.status_code == 201:
        return response.json()["data"]  # Contains embed_code, player_url, etc.
    raise Exception(f"Failed to create video: {response.text}")
