import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import Course
from spotplayer.services import provision_license_for_course
from spotplayer.models import SpotPlayerLicense

User = get_user_model()

user = User.objects.filter(id=20).first()
if not user:
    user = User.objects.first()

course = Course.objects.filter(id=27).first()

print("USER:", user)
print("COURSE:", course)

# Force re-provision in test mode
license_obj, created, error = provision_license_for_course(user, course, force=True)

print("PROVISION RESULT:")
print("  license_obj:", license_obj)
print("  created:", created)
print("  error:", error)

if license_obj:
    print("  SpotPlayer License ID:", license_obj.spotplayer_license_id)
    print("  SpotPlayer License Key:", license_obj.spotplayer_license_key)
    print("  SpotPlayer URL:", license_obj.spotplayer_url)
    print("  Test Mode:", license_obj.test_mode)
