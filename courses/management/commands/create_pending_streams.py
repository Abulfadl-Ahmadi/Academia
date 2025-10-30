from django.core.management.base import BaseCommand
from courses.models import Course
from utils.vod import create_stream
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
        max_attempts = options['max_attempts']
        delay = options['delay']
        course_id = options['course_id']

        if course_id:
            courses = Course.objects.filter(id=course_id, stream_id__isnull=True)
        else:
            courses = Course.objects.filter(stream_id__isnull=True)

        if not courses:
            self.stdout.write('No courses found that need live streams.')
            return

        self.stdout.write(f'Found {courses.count()} courses that need live streams.')

        for course in courses:
            self.stdout.write(f'Processing course: {course.title} (ID: {course.id})')

            for attempt in range(max_attempts):
                try:
                    self.stdout.write(f'  Attempt {attempt + 1}/{max_attempts}...')
                    stream_response = create_stream(course.title, course.id)
                    stream_id = stream_response.get('data', {}).get('id')

                    course.stream_id = stream_id
                    course.save(update_fields=['stream_id'])

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

        self.stdout.write('Finished processing courses.')