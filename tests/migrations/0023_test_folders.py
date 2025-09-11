from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('knowledge', '0004_folder'),
        ('tests', '0022_merge_conflicts'),
    ]

    operations = [
        migrations.AddField(
            model_name='test',
            name='folders',
            field=models.ManyToManyField(blank=True, help_text='پوشه(های) مرتبط برای آزمون مبحثی', related_name='tests', to='knowledge.folder', verbose_name='پوشه‌ها'),
        ),
    ]
