#!/usr/bin/env python
"""
Script to assign parent folders to questions based on their currently selected folders.

This script ensures that if a question is assigned to a specific folder,
it will also be assigned to all parent folders in the hierarchy.

Usage:
    python assign_parent_folders_to_questions.py [options]

Options:
    --dry-run           Show what would be done without making changes
    --question-id       Process only a specific question by its public_id
    --folder-id         Process only questions in a specific folder
"""

import os
import sys
import django
from django.db import transaction

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from knowledge.models import Folder
from tests.models import Question


def get_all_parent_folders(folder):
    """Recursively get all parent folders for a given folder"""
    parents = []
    current = folder.parent
    
    while current:
        parents.append(current)
        current = current.parent
        
        # Safety check to prevent infinite loops
        if len(parents) > 10:  # Assuming max depth of 10
            print(f'Warning: Deep folder hierarchy detected for folder {folder.name}. '
                  f'Stopping at depth 10 to prevent infinite loop.')
            break
    
    return parents


def assign_parent_folders(dry_run=False, question_id=None, folder_id=None):
    """Main function to assign parent folders to questions"""
    
    print(f'{"[DRY RUN] " if dry_run else ""}Starting parent folder assignment...')
    
    # Get questions to process
    questions = Question.objects.filter(is_active=True)
    
    if question_id:
        questions = questions.filter(public_id=question_id)
        if not questions.exists():
            print(f'Error: Question with ID {question_id} not found')
            return
    
    if folder_id:
        questions = questions.filter(folders__id=folder_id).distinct()

    total_questions = questions.count()
    print(f'Processing {total_questions} questions...\n')

    processed_count = 0
    updated_count = 0

    with transaction.atomic():
        for question in questions.prefetch_related('folders'):
            processed_count += 1
            
            # Get all currently assigned folders
            current_folders = list(question.folders.all())
            
            if not current_folders:
                print(f'Question {question.public_id}: No folders assigned, skipping')
                continue

            # Get all parent folders that should be assigned
            parent_folders_to_add = set()
            
            for folder in current_folders:
                # Get all parent folders for this folder
                parents = get_all_parent_folders(folder)
                parent_folders_to_add.update(parents)

            # Remove folders that are already assigned
            current_folder_ids = set(f.id for f in current_folders)
            new_parent_folders = [f for f in parent_folders_to_add if f.id not in current_folder_ids]

            if new_parent_folders:
                updated_count += 1
                
                folder_names = [f.name for f in new_parent_folders]
                print(f'Question {question.public_id}: Adding parent folders: {", ".join(folder_names)}')
                
                if not dry_run:
                    # Add the parent folders to the question
                    question.folders.add(*new_parent_folders)
            else:
                print(f'Question {question.public_id}: No parent folders to add')

            # Progress indicator
            if processed_count % 100 == 0:
                print(f'Processed {processed_count}/{total_questions} questions...')

    # Summary
    print('\n' + '='*50)
    print(f'{"[DRY RUN] " if dry_run else ""}Completed!')
    print(f'Total questions processed: {processed_count}')
    print(f'Questions updated: {updated_count}')
    print(f'Questions unchanged: {processed_count - updated_count}')


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Assign parent folders to questions based on their currently selected folders'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    parser.add_argument(
        '--question-id',
        type=str,
        help='Process only a specific question by its public_id'
    )
    parser.add_argument(
        '--folder-id',
        type=int,
        help='Process only questions in a specific folder'
    )
    
    args = parser.parse_args()
    
    try:
        assign_parent_folders(
            dry_run=args.dry_run,
            question_id=args.question_id,
            folder_id=args.folder_id
        )
    except KeyboardInterrupt:
        print('\nOperation cancelled by user.')
    except Exception as e:
        print(f'Error: {e}')
        sys.exit(1)