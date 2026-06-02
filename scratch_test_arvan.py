import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Academia.settings')
django.setup()

from utils.vod import get_stream

response = get_stream('b7406c26-c838-4d07-b673-197d646e2aa6')

with open('scratch/stream_info.json', 'w', encoding='utf-8') as f:
    json.dump(response, f, indent=4, ensure_ascii=False)
print("Saved to scratch/stream_info.json")
