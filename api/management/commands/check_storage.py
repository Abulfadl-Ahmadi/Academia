import uuid
import traceback
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


class Command(BaseCommand):
    help = "Diagnostics for S3/ParsPack storage connection and permissions (run: manage.py storage_check)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("--- Storage Diagnostics Start ---"))
        cfg = {
            'AWS_STORAGE_BUCKET_NAME': getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None),
            'AWS_S3_ENDPOINT_URL': getattr(settings, 'AWS_S3_ENDPOINT_URL', None),
            'AWS_S3_REGION_NAME': getattr(settings, 'AWS_S3_REGION_NAME', None),
            'AWS_S3_CUSTOM_DOMAIN': getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None),
            'AWS_DEFAULT_ACL': getattr(settings, 'AWS_DEFAULT_ACL', None),
            'LOCATION': getattr(getattr(default_storage, 'location', ''), 'strip', lambda: '')(),
            'DEFAULT_FILE_STORAGE': getattr(settings, 'DEFAULT_FILE_STORAGE', None),
        }
        for k, v in cfg.items():
            self.stdout.write(f"{k}: {v}")

        key = f"diagnostics/{uuid.uuid4()}.txt"
        content = b"storage diagnostic test"
        try:
            self.stdout.write("Attempting write (PUT)...")
            saved_path = default_storage.save(key, ContentFile(content))
            self.stdout.write(self.style.SUCCESS(f"PUT OK -> {saved_path}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR("PUT FAILED:"))
            self.stdout.write(str(e))
            self.stdout.write(traceback.format_exc())
            return

        try:
            self.stdout.write("Attempting HEAD / exists() ...")
            exists = default_storage.exists(saved_path)
            self.stdout.write(self.style.SUCCESS(f"HEAD exists() -> {exists}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR("HEAD / exists FAILED:"))
            self.stdout.write(str(e))

        try:
            self.stdout.write("Attempting open/read ...")
            with default_storage.open(saved_path, 'rb') as f:
                data = f.read()
            self.stdout.write(self.style.SUCCESS(f"READ OK ({len(data)} bytes)"))
        except Exception as e:
            self.stdout.write(self.style.ERROR("READ FAILED:"))
            self.stdout.write(str(e))

        # Cleanup
        try:
            default_storage.delete(saved_path)
            self.stdout.write(self.style.SUCCESS("Deleted test object."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"CLEANUP FAILED: {e}"))

        self.stdout.write(self.style.WARNING("--- Storage Diagnostics End ---"))
