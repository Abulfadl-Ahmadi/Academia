from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tests', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='test',
            name='knowledge_path',
            field=models.JSONField(blank=True, default=list, help_text='Path nodes when no final topic exists: list of {level: str, id: int | null}', null=True),
        ),
    ]
