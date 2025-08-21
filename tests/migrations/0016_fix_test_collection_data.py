# Generated manually to fix data before schema changes

from django.db import migrations, models
from django.db import transaction


def assign_default_test_collection(apps, schema_editor):
    """Assign a default test collection to tests that don't have one"""
    Test = apps.get_model('tests', 'Test')
    TestCollection = apps.get_model('tests', 'TestCollection')
    User = apps.get_model('accounts', 'User')
    
    # Find tests without test_collection
    tests_without_collection = Test.objects.filter(test_collection__isnull=True)
    
    if tests_without_collection.exists():
        # Get or create a default test collection
        try:
            # Try to get an existing teacher (preferably the first one)
            first_teacher = User.objects.filter(role='teacher').first()
            if not first_teacher:
                # If no teacher exists, create a default one or use admin
                first_teacher = User.objects.filter(is_superuser=True).first()
                if not first_teacher:
                    # If no admin exists, skip this migration
                    return
            
            default_collection, created = TestCollection.objects.get_or_create(
                name='مجموعه پیش‌فرض',
                defaults={
                    'description': 'مجموعه پیش‌فرض برای آزمون‌های بدون مجموعه',
                    'created_by': first_teacher,
                    'is_active': True
                }
            )
            
            # Assign this collection to all tests without collection
            with transaction.atomic():
                for test in tests_without_collection:
                    test.test_collection = default_collection
                    test.save()
                    
        except Exception as e:
            # Log the error but don't fail the migration
            print(f"Warning: Could not assign default test collection: {e}")


def reverse_assign_default_test_collection(apps, schema_editor):
    """Reverse operation - not needed as we don't want to break data"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tests', '0014_remove_test_course_alter_test_test_collection'),
    ]

    operations = [
        migrations.RunPython(
            assign_default_test_collection,
            reverse_assign_default_test_collection,
        ),
    ]
