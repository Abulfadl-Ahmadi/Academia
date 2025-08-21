# Generated manually to make test_collection required after data fix

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tests', '0015_alter_test_test_collection'),
    ]

    operations = [
        migrations.AlterField(
            model_name='test',
            name='test_collection',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tests', to='tests.testcollection', verbose_name='مجموعه آزمون'),
        ),
    ]
