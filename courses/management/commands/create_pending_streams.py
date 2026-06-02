from django.core.management.base import BaseCommand
from courses.models import Course
from utils.vod import create_stream, get_stream
import logging
import time

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Create live streams for courses that don\'t have them yet'

    def add_arguments(self, parser):
        parser.add_argument(
            '--max-attempts',
            type=int,
            default=3,
            help='Maximum attempts per course (default: 3)',
        )
        parser.add_argument(
            '--delay',
            type=int,
            default=30,
            help='Delay between attempts in seconds (default: 30)',
        )
        parser.add_argument(
            '--course-id',
            type=int,
            help='Process only specific course ID',
        )

    def handle(self, *args, **options):
        import sys
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
        max_attempts = options['max_attempts']
        delay = options['delay']
        course_id = options['course_id']

        if course_id:
            courses = Course.objects.filter(id=course_id)
        else:
            courses = Course.objects.all()

        if not courses.exists():
            self.stdout.write('No courses found.')
            return

        self.stdout.write(f'Processing {courses.count()} courses for live stream status.')

        for course in courses:
            # Case 1: Course has no stream yet
            if not course.stream_id:
                self.stdout.write(f'Processing course (creating stream): {course.title} (ID: {course.id})')
                for attempt in range(max_attempts):
                    try:
                        self.stdout.write(f'  Attempt {attempt + 1}/{max_attempts}...')
                        stream_response = create_stream(course.title, course.id)
                        stream_data = stream_response.get('data', {})
                        stream_id = stream_data.get('id')
                        input_url = stream_data.get('input_url', '')
                        if input_url:
                            parts = input_url.rsplit('/', 1)
                            rtmp_url = parts[0]
                            rtmp_key = parts[1] if len(parts) > 1 else ''
                        else:
                            rtmp_url = ''
                            rtmp_key = ''
                            
                        player_url = stream_data.get('player_url', '')
                        live_iframe = f'<iframe src="{player_url}" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" width="100%" height="100%" style="border: none;"></iframe>' if player_url else ''

                        course.stream_id = stream_id
                        course.rtmp_url = rtmp_url
                        course.rtmp_key = rtmp_key
                        course.live_iframe = live_iframe
                        course.save(update_fields=['stream_id', 'rtmp_url', 'rtmp_key', 'live_iframe'])

                        self.stdout.write(
                            self.style.SUCCESS(f'  Successfully created live stream {stream_id} for course "{course.title}"')
                        )
                        break

                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'  Attempt {attempt + 1} failed: {str(e)}')
                        )

                        if attempt < max_attempts - 1:
                            self.stdout.write(f'  Waiting {delay} seconds before next attempt...')
                            time.sleep(delay)
                        else:
                            self.stdout.write(
                                self.style.ERROR(f'  Failed to create live stream for course "{course.title}" after {max_attempts} attempts')
                            )
            # Case 2: Course has stream_id but missing RTMP credentials or player iframe
            elif not course.rtmp_url or not course.rtmp_key or not course.live_iframe:
                self.stdout.write(f'Processing course (fetching details): {course.title} (ID: {course.id}, Stream ID: {course.stream_id})')
                try:
                    stream_response = get_stream(course.stream_id)
                    if stream_response:
                        stream_data = stream_response.get('data', {})
                        input_url = stream_data.get('input_url', '')
                        if input_url:
                            parts = input_url.rsplit('/', 1)
                            rtmp_url = parts[0]
                            rtmp_key = parts[1] if len(parts) > 1 else ''
                        else:
                            rtmp_url = ''
                            rtmp_key = ''
                            
                        player_url = stream_data.get('player_url', '')
                        live_iframe = f'<iframe src="{player_url}" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" width="100%" height="100%" style="border: none;"></iframe>' if player_url else ''
                        
                        course.rtmp_url = rtmp_url
                        course.rtmp_key = rtmp_key
                        course.live_iframe = live_iframe
                        course.save(update_fields=['rtmp_url', 'rtmp_key', 'live_iframe'])
                        
                        self.stdout.write(
                            self.style.SUCCESS(f'  Successfully updated stream details for course "{course.title}"')
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'  Failed to fetch stream details for stream ID {course.stream_id}')
                        )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'  Error updating stream details for course "{course.title}": {str(e)}')
                    )

        self.stdout.write('Finished processing courses.')