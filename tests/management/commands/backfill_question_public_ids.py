from django.core.management.base import BaseCommand
from django.db import transaction
from tests.models import Question, validate_question_id, generate_secure_question_id

class Command(BaseCommand):
    help = "Backfill or repair 6-char public_id for existing Question rows. Ensures validity and uniqueness."

    def handle(self, *args, **options):
        fixed = 0
        skipped_valid = 0
        total = Question.objects.count()

        self.stdout.write(self.style.NOTICE(f"Scanning {total} questions for missing/invalid public_id..."))
        with transaction.atomic():
            for q in Question.objects.select_for_update().all():
                needs_fix = False
                # If empty or invalid format
                if not q.public_id or not validate_question_id(q.public_id):
                    needs_fix = True
                else:
                    # Ensure uniqueness constraint not violated by duplicates
                    dup_count = Question.objects.filter(public_id=q.public_id).exclude(pk=q.pk).count()
                    if dup_count > 0:
                        needs_fix = True

                if not needs_fix:
                    skipped_valid += 1
                    continue

                # Generate a new unique, valid id
                new_id = generate_secure_question_id()
                # Guard against rare collision
                attempts = 0
                while Question.objects.filter(public_id=new_id).exclude(pk=q.pk).exists():
                    attempts += 1
                    if attempts > 10:
                        self.stdout.write(self.style.WARNING(f"Too many collisions for question {q.pk}; retry later."))
                        break
                    new_id = generate_secure_question_id()

                q.public_id = new_id
                q.save(update_fields=["public_id"])
                fixed += 1

        self.stdout.write(self.style.SUCCESS(f"Backfill complete. Fixed: {fixed}, Already valid: {skipped_valid}, Total: {total}"))
