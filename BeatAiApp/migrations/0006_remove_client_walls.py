# Generated by Django 3.2.5 on 2021-09-25 12:23

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('BeatAiApp', '0005_auto_20210922_1057'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='client',
            name='walls',
        ),
    ]
