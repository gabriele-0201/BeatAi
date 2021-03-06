# Generated by Django 3.2.5 on 2021-09-22 08:39

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Output',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('population', models.IntegerField()),
                ('rows', models.IntegerField()),
                ('columns', models.IntegerField()),
                ('height', models.IntegerField()),
                ('width', models.IntegerField()),
                ('win', models.BooleanField(default=False)),
                ('incLean', models.BooleanField()),
                ('stopThread', models.BooleanField(default=False)),
                ('minDistance', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Generation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('generation', models.JSONField()),
                ('output', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='BeatAiApp.output')),
            ],
        ),
    ]
