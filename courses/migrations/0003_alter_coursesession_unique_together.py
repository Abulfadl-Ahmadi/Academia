from django.db import migrations

def dedupe_session_numbers(apps, schema_editor):
    CourseSession = apps.get_model('courses', 'CourseSession')
    # Order by course_id, session_number, id to process deterministically
    sessions = CourseSession.objects.all().order_by('course_id', 'session_number', 'id')

    used_by_course = {}  # course_id -> set of used numbers

    for s in sessions:
        used = used_by_course.setdefault(s.course_id, set())
        n = s.session_number
        if n in used:
            # Find next available session number for this course
            new_n = n
            while new_n in used:
                new_n += 1
            s.session_number = new_n
            s.save(update_fields=['session_number'])
            used.add(new_n)
        else:
            used.add(n)

class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0002_alter_coursesession_options_course_created_at_and_more'),
    ]

    operations = [
        migrations.RunPython(dedupe_session_numbers, migrations.RunPython.noop),
    ]