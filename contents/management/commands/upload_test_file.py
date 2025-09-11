import uuid
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

class Command(BaseCommand):
    help = "Upload a small test file to default storage and report the URL/path."

    def add_arguments(self, parser):
        parser.add_argument('--name', default=None, help='Optional base name for the test file')
        parser.add_argument('--content', default='hello test', help='Content to write')
        parser.add_argument('--prefix', default='diagnostics', help='Key prefix/folder')

    def handle(self, *args, **options):
        base = options['name'] or str(uuid.uuid4())
        key = f"{options['prefix'].rstrip('/')}/{base}.txt"
        data = options['content'].encode('utf-8')

        self.stdout.write(self.style.WARNING(f"Uploading test object: {key}"))
        saved_path = default_storage.save(key, ContentFile(data))
        self.stdout.write(self.style.SUCCESS(f"Saved path: {saved_path}"))
        try:
            url = default_storage.url(saved_path)
        except Exception as e:
            url = f"(Could not build URL: {e})"
        self.stdout.write(f"Accessible URL (if public): {url}")
        exists = default_storage.exists(saved_path)
        self.stdout.write(f"Exists check: {exists}")
        if not exists:
            self.stdout.write(self.style.ERROR('File does not exist after upload.'))
        else:
            with default_storage.open(saved_path, 'rb') as f:
                content = f.read(64)
            self.stdout.write(f"Read back first bytes: {content!r}")
        self.stdout.write(self.style.WARNING('Done.'))
