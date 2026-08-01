import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from spotplayer.services import SpotPlayerService

res = SpotPlayerService.create_license(
    course_ids=["6a6e3c8c6632a4a6f03387db"],
    user_name="testuser",
    watermark_text="09120000000"
)
print("SUCCESSFULLY CREATED LICENSE:", res)
