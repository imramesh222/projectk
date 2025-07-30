from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Client
from apps.notifications.utils import send_notification_to_salesperson

@receiver(post_save, sender=Client)
def notify_salesperson_on_client_creation(sender, instance, created, **kwargs):
    if created:
        send_notification_to_salesperson(
            user=instance.salesperson,
            message=f"New client '{instance.name}' has been added."
        )
