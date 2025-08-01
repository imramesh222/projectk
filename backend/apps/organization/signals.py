from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AdminAssignment
from .tasks import send_admin_assignment_email

@receiver(post_save, sender=AdminAssignment)
def notify_admin_assignment(sender, instance, created, **kwargs):
    if created and instance.admin and instance.organization:
        # Send email notification asynchronously
        send_admin_assignment_email.delay(
            user_id=instance.admin.id,
            org_name=instance.organization.name
        )
