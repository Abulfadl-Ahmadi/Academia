import os
import sys
import django

# Set up Django environment
if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
    django.setup()

    from tests.models import TestCollection
    from accounts.models import User

    # Check collection details
    try:
        collection = TestCollection.objects.get(id=6)
        print(f"Collection: {collection.name}")
        print(f"Created by: {collection.created_by.username} (role: {collection.created_by.role})")
        print(f"is_public: {collection.is_public}")
        print(f"Courses: {[course.title for course in collection.courses.all()]}")

        # Check if there are any teachers
        teachers = User.objects.filter(role='teacher')
        print(f"Available teachers: {[f'{t.username} ({t.id})' for t in teachers]}")

    except TestCollection.DoesNotExist:
        print("Collection with ID 6 not found")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()