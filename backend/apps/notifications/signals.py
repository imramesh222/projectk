from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User
from .models import Notification
from .tasks import create_notification

@receiver(post_save, sender=User)
def notify_new_user(sender, instance, created, **kwargs):
    if created and instance.role == 'admin':
        create_notification.delay(instance.id, "You have been successfully assigned as admin to this organization.")
