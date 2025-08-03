from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import User
from .tasks import send_welcome_email_task

@receiver(post_save, sender=User)
def send_welcome_email_on_creation(sender, instance, created, **kwargs):
    """
    Signal receiver to send welcome email when a new user is created.
    Works for all user types including superusers created via createsuperuser.
    """
    if created and getattr(settings, 'SEND_WELCOME_EMAIL', False):
        send_welcome_email_task.delay(instance.id)
