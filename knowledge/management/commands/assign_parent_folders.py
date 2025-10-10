from django.core.management.base import BaseCommand
from django.db import transaction
from knowledge.models import Folder
from tests.models import Question


class Command(BaseCommand):
    help = 'Assign parent folders to questions based on their currently selected folders'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--question-id',
            type=str,
            help='Process only a specific question by its public_id',
        )
        parser.add_argument(
            '--folder-id',
            type=int,
            help='Process only questions in a specific folder',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        question_id = options['question_id']
        folder_id = options['folder_id']

        self.stdout.write(
            self.style.SUCCESS(
                f'{"[DRY RUN] " if dry_run else ""}Starting parent folder assignment...'
            )
        )

        # Get questions to process
        questions = Question.objects.filter(is_active=True)
        
        if question_id:
            questions = questions.filter(public_id=question_id)
            if not questions.exists():
                self.stdout.write(
                    self.style.ERROR(f'Question with ID {question_id} not found')
                )
                return
        
        if folder_id:
            questions = questions.filter(folders__id=folder_id).distinct()

        total_questions = questions.count()
        self.stdout.write(f'Processing {total_questions} questions...\n')

        processed_count = 0
        updated_count = 0

        with transaction.atomic():
            for question in questions.prefetch_related('folders'):
                processed_count += 1
                
                # Get all currently assigned folders
                current_folders = list(question.folders.all())
                
                if not current_folders:
                    self.stdout.write(
                        f'Question {question.public_id}: No folders assigned, skipping'
                    )
                    continue

                # Get all parent folders that should be assigned
                parent_folders_to_add = set()
                
                for folder in current_folders:
                    # Get all parent folders for this folder
                    parents = self.get_all_parent_folders(folder)
                    parent_folders_to_add.update(parents)

                # Remove folders that are already assigned
                current_folder_ids = set(f.id for f in current_folders)
                new_parent_folders = [f for f in parent_folders_to_add if f.id not in current_folder_ids]

                if new_parent_folders:
                    updated_count += 1
                    
                    folder_names = [f.name for f in new_parent_folders]
                    self.stdout.write(
                        f'Question {question.public_id}: Adding parent folders: {", ".join(folder_names)}'
                    )
                    
                    if not dry_run:
                        # Add the parent folders to the question
                        question.folders.add(*new_parent_folders)
                else:
                    self.stdout.write(
                        f'Question {question.public_id}: No parent folders to add'
                    )

                # Progress indicator
                if processed_count % 100 == 0:
                    self.stdout.write(f'Processed {processed_count}/{total_questions} questions...')

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(
            self.style.SUCCESS(
                f'{"[DRY RUN] " if dry_run else ""}Completed!'
            )
        )
        self.stdout.write(f'Total questions processed: {processed_count}')
        self.stdout.write(f'Questions updated: {updated_count}')
        self.stdout.write(f'Questions unchanged: {processed_count - updated_count}')

    def get_all_parent_folders(self, folder):
        """Recursively get all parent folders for a given folder"""
        parents = []
        current = folder.parent
        
        while current:
            parents.append(current)
            current = current.parent
            
            # Safety check to prevent infinite loops
            if len(parents) > 10:  # Assuming max depth of 10
                self.stdout.write(
                    self.style.WARNING(
                        f'Warning: Deep folder hierarchy detected for folder {folder.name}. '
                        f'Stopping at depth 10 to prevent infinite loop.'
                    )
                )
                break
        
        return parents