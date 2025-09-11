from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('knowledge', '0003_alter_topic_options_alter_topic_section_lesson_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Folder',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='نام پوشه')),
                ('description', models.TextField(blank=True, null=True, verbose_name='توضیحات')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='ترتیب')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='knowledge.folder', verbose_name='پوشه والد')),
            ],
            options={
                'verbose_name': 'پوشه',
                'verbose_name_plural': 'پوشه‌ها',
                'ordering': ['parent__id', 'order', 'id'],
                'unique_together': {('parent', 'name')},
            },
        ),
    ]
