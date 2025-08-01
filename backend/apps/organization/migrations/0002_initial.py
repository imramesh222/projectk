# Generated by Django 5.0.7 on 2025-07-25 22:44

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('organization', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='adminassignment',
            name='admin',
            field=models.OneToOneField(limit_choices_to={'role': 'admin'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='developer',
            name='user',
            field=models.OneToOneField(limit_choices_to={'role': 'developer'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='developer',
            name='organization',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organization.organization'),
        ),
        migrations.AddField(
            model_name='adminassignment',
            name='organization',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organization.organization'),
        ),
        migrations.AddField(
            model_name='projectmanager',
            name='organization',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organization.organization'),
        ),
        migrations.AddField(
            model_name='projectmanager',
            name='user',
            field=models.OneToOneField(limit_choices_to={'role': 'project_manager'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='salesperson',
            name='organization',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organization.organization'),
        ),
        migrations.AddField(
            model_name='salesperson',
            name='user',
            field=models.OneToOneField(limit_choices_to={'role': 'salesperson'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='support',
            name='organization',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organization.organization'),
        ),
        migrations.AddField(
            model_name='support',
            name='user',
            field=models.OneToOneField(limit_choices_to={'role': 'support'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='verifier',
            name='organization',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organization.organization'),
        ),
        migrations.AddField(
            model_name='verifier',
            name='user',
            field=models.OneToOneField(limit_choices_to={'role': 'verifier'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
