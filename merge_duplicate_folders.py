#!/usr/bin/env python
"""
Duplicate Folders Merge Script
This script identifies and merges folders that have the same name and parent
"""

import os
import django
from collections import defaultdict

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")
django.setup()

from knowledge.models import Folder
from tests.models import Question
from django.db import transaction
from django.db.models import Count


def analyze_duplicate_folders():
    """Analyze duplicate folders"""
    print("=== Duplicate Folders Analysis ===\n")
    
    # Group folders by name and parent
    folder_groups = defaultdict(list)
    
    for folder in Folder.objects.all():
        key = (folder.name, folder.parent_id if folder.parent else None)
        folder_groups[key].append(folder)
    
    # Find duplicate folders
    duplicates = {k: v for k, v in folder_groups.items() if len(v) > 1}
    
    if not duplicates:
        print("✅ No duplicate folders found!")
        return duplicates
    
    total_duplicates = 0
    total_questions = 0
    
    for (name, parent_id), folders in duplicates.items():
        parent_name = folders[0].parent.name if folders[0].parent else "Root"
        duplicate_count = len(folders)
        total_duplicates += duplicate_count - 1  # Extra count
        
        print(f"📁 Name: '{name}', Parent: '{parent_name}' - {duplicate_count} duplicates:")
        
        folder_questions = 0
        for i, folder in enumerate(folders, 1):
            q_count = folder.questions.count()
            folder_questions += q_count
            print(f"  {i}. ID: {folder.id}, Questions: {q_count}")
        
        total_questions += folder_questions
        print(f"  📊 Total questions: {folder_questions}\n")
    
    print(f"📈 Summary:")
    print(f"   - Duplicate folder groups: {len(duplicates)}")
    print(f"   - Extra folders: {total_duplicates}")
    print(f"   - Total questions involved: {total_questions}")
    
    return duplicates


def merge_child_folders(source_folder, target_folder, dry_run=True):
    """Merge children of source folder to target folder"""
    moved_children = 0
    
    for child in source_folder.children.all():
        # Check if child folder with same name exists in target folder
        existing_child = target_folder.children.filter(name=child.name).first()
        
        if existing_child:
            # If child folder with same name exists, merge them
            print(f"     🔄 Merging duplicate child: '{child.name}' (ID {child.id} -> ID {existing_child.id})")
            
            if not dry_run:
                # Transfer child's questions
                for question in child.questions.all():
                    question.folders.remove(child)
                    question.folders.add(existing_child)
                
                # Recursively merge children
                merge_child_folders(child, existing_child, dry_run=False)
                
                # Delete duplicate child
                child.delete()
            moved_children += 1
        else:
            # If child folder is not duplicate, just change its parent
            print(f"     📁 Moving child: '{child.name}' (ID {child.id})")
            if not dry_run:
                child.parent = target_folder
                child.save()
            moved_children += 1
    
    return moved_children


@transaction.atomic
def merge_duplicate_folders(duplicates, dry_run=True):
    """Merge duplicate folders"""
    
    if dry_run:
        print("\n🔍 Test mode - No changes will be applied")
    else:
        print("\n🔄 Starting duplicate folder merge...")
    
    merged_count = 0
    questions_moved = 0
    children_moved = 0
    
    for (name, parent_id), folders in duplicates.items():
        if len(folders) <= 1:
            continue
            
        # Select main folder (folder with most questions)
        main_folder = max(folders, key=lambda f: f.questions.count())
        duplicate_folders = [f for f in folders if f.id != main_folder.id]
        
        parent_name = main_folder.parent.name if main_folder.parent else "Root"
        
        print(f"\n📁 Merging '{name}' (Parent: '{parent_name}'):")
        print(f"   Main folder: ID {main_folder.id} (Questions: {main_folder.questions.count()})")
        
        folder_questions_moved = 0
        folder_children_moved = 0
        
        for dup_folder in duplicate_folders:
            dup_questions = dup_folder.questions.count()
            dup_children = dup_folder.children.count()
            
            print(f"   Merging: ID {dup_folder.id} (Questions: {dup_questions}, Children: {dup_children})")
            
            if not dry_run:
                # Transfer questions
                for question in dup_folder.questions.all():
                    question.folders.remove(dup_folder)
                    question.folders.add(main_folder)
                    folder_questions_moved += 1
                
                # Merge children (with name conflict management)
                folder_children_moved += merge_child_folders(dup_folder, main_folder, dry_run=False)
                
                # Delete duplicate folder
                dup_folder.delete()
            else:
                # In test mode, just count
                folder_questions_moved += dup_questions
                folder_children_moved += dup_children
            
            merged_count += 1
        
        questions_moved += folder_questions_moved
        children_moved += folder_children_moved
        print(f"   ✅ {len(duplicate_folders)} folders merged")
    
    if dry_run:
        print(f"\n📋 Summary (Test mode):")
        print(f"   - Folders to be merged: {merged_count}")
        print(f"   - Questions to be moved: {questions_moved}")
        print(f"   - Children to be moved: {children_moved}")
        print(f"\n💡 To apply changes: merge_duplicate_folders(duplicates, dry_run=False)")
    else:
        print(f"\n✅ Merge completed:")
        print(f"   - Folders merged: {merged_count}")
        print(f"   - Questions moved: {questions_moved}")
        print(f"   - Children moved: {children_moved}")


def clean_empty_folders():
    """Delete empty folders"""
    empty_folders = Folder.objects.filter(
        questions__isnull=True,
        children__isnull=True
    ).distinct()
    
    count = empty_folders.count()
    if count > 0:
        print(f"\n🗑️ Empty folders found: {count}")
        for folder in empty_folders:
            parent_name = folder.parent.name if folder.parent else "Root"
            print(f"   - '{folder.name}' (Parent: '{parent_name}', ID: {folder.id})")
        
        confirm = input(f"\nDo you want to delete {count} empty folders? (y/N): ")
        if confirm.lower() == 'y':
            empty_folders.delete()
            print(f"✅ {count} empty folders deleted")
        else:
            print("❌ Deletion cancelled")
    else:
        print("\n✅ No empty folders found")


def main():
    print("🔍 Duplicate Folders Analysis and Merge\n")
    
    # Analyze duplicate folders
    duplicates = analyze_duplicate_folders()
    
    if not duplicates:
        return
    
    # Display options
    print("\n📋 Available options:")
    print("1. Merge duplicate folders (Test mode)")
    print("2. Merge duplicate folders (Apply changes)")
    print("3. Delete empty folders")
    print("4. Exit")
    
    while True:
        choice = input("\nSelect option (1-4): ").strip()
        
        if choice == '1':
            merge_duplicate_folders(duplicates, dry_run=True)
            break
        elif choice == '2':
            confirm = input("⚠️  Are you sure? This operation cannot be undone! (y/N): ")
            if confirm.lower() == 'y':
                merge_duplicate_folders(duplicates, dry_run=False)
                print("\n🧹 Checking for empty folders...")
                clean_empty_folders()
            else:
                print("❌ Operation cancelled")
            break
        elif choice == '3':
            clean_empty_folders()
            break
        elif choice == '4':
            print("👋 Exit...")
            break
        else:
            print("❌ Invalid choice! Please enter a number between 1-4.")


if __name__ == "__main__":
    main()