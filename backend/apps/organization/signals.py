from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AdminAssignment
from apps.notifications.utils import send_notification_to_admin

@receiver(post_save, sender=AdminAssignment)
def notify_admin_assignment(sender, instance, created, **kwargs):
    if created:
        send_notification_to_admin(
            user=instance.admin,
            message=f"You've been assigned as an admin to {instance.organization.name}"
        )
