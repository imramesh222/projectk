from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_fix_welcome_email_sent_null'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='welcome_email_sent',
            field=models.BooleanField(
                default=False,
                help_text='Whether the welcome email has been sent to this user.',
                null=True,  # Allow NULL in database
                blank=True  # Allow blank in forms
            ),
        ),
    ]
