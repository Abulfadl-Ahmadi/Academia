from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0003_alter_coursesession_unique_together'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='coursesession',
            unique_together={('course', 'session_number')},
        ),
    ]