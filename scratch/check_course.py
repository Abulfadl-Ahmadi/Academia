import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from courses.models import Course

c = Course.objects.get(id=27)
print("COURSE 27 TITLE:", c.title)
print("COURSE 27 SPOTPLAYER ID:", repr(getattr(c, 'spotplayer_course_id', None)))
