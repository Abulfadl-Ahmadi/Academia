import requests
import base64
from decouple import config

VOD_API_KEY = config('VOD_API_KEY')
VOD_BASE_URL = config('VOD_BASE_URL')

HEADERS = {
    "Authorization": f"Apikey {VOD_API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json", # It's good practice to specify you want JSON back
}


# The signature should not include file_size, as this method doesn't use it.
def create_upload_url(channel_id: str, file_name: str, file_type: str):
    
    # This hardcoded ID should be removed if you want dynamic channels.
    channel_id = "86515078-d523-4927-8233-2b6b3b022986"

    # Create a JSON payload (the correct method for pre-signed URLs)
    data = {
        "channel_id": channel_id,
        "title": file_name,
        "file_type": file_type,
    }
    
    # Send the request with the JSON data in the `json` parameter
    response = requests.post(f"{VOD_BASE_URL}/channels/{channel_id}/files", headers=HEADERS, json=data)
    
    # This will now work because the API will return a JSON body
    if response.status_code == 201:
        return response.json()["data"]
        
    # Provide a more detailed error message for debugging
    raise Exception(f"Failed to create upload URL: {response.status_code} - {response.text}")

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
