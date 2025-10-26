# Scripts Directory

This directory contains utility scripts for the Academia platform.

## Structure

```
scripts/
├── README.md (this file)
├── deploy.sh (deployment script)
└── data_migration/ (data migration utilities)
    ├── assign_parent_folders_to_questions.py
    ├── backup_questions_to_json.py
    ├── merge_duplicate_folders.py
    └── update_question_folders.py
```

## Deployment Script

### deploy.sh
- **Purpose**: Production deployment script
- **Usage**: `./deploy.sh`
- **Description**: Handles the deployment process for the Academia platform

## Data Migration Scripts

### assign_parent_folders_to_questions.py
- **Purpose**: Assign parent folders to questions based on their currently selected folders
- **Usage**: `python manage.py assign_parent_folders [--dry-run] [--question-id ID] [--folder-id ID]`
- **Options**:
  - `--dry-run`: Show what would be done without making changes
  - `--question-id`: Process only a specific question by its public_id
  - `--folder-id`: Process only questions in a specific folder
- **When to use**: When migrating from old knowledge hierarchy to new folder system

### backup_questions_to_json.py
- **Purpose**: Backup questions data to JSON format
- **Usage**: `python manage.py backup_questions_to_json`
- **Output**: Creates a JSON backup of all questions
- **When to use**: Before major data migrations or as a safety measure

### merge_duplicate_folders.py
- **Purpose**: Merge duplicate folders in the knowledge tree
- **Usage**: `python manage.py merge_duplicate_folders`
- **When to use**: When cleaning up duplicate folder entries

### update_question_folders.py
- **Purpose**: Update question folder assignments
- **Usage**: `python manage.py update_question_folders`
- **When to use**: When reorganizing the knowledge tree structure

## Running Scripts

All scripts should be run from the project root directory with the Django environment activated:

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run migration scripts
python manage.py assign_parent_folders --dry-run
python manage.py backup_questions_to_json
```

## Safety Notes

- Always run scripts with `--dry-run` first to see what changes will be made
- Create database backups before running migration scripts
- Test scripts on a development environment before production use
- Some scripts may take time to complete depending on data size

## Troubleshooting

If you encounter issues:

1. Check Django environment is activated
2. Ensure database is accessible
3. Verify script permissions
4. Check logs for detailed error messages
5. Test with `--dry-run` first

## Contributing

When adding new scripts:

1. Follow the existing naming convention
2. Add proper command-line arguments
3. Include dry-run functionality where applicable
4. Update this README with script documentation
5. Test thoroughly before committing
