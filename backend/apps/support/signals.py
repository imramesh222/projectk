# apps/support/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import SupportTicket
from .tasks import notify_ticket_assigned, auto_close_resolved_tickets

@receiver(post_save, sender=SupportTicket)
def handle_support_ticket_updates(sender, instance, created, **kwargs):
    """
    Handle support ticket updates and delegate to Celery tasks
    """
    if created and instance.assigned_to:
        # Notify assigned agent about new ticket
        notify_ticket_assigned.delay(instance.id)
    elif instance.tracker.has_changed('status'):
        # Handle status changes
        if instance.status == "resolved":
            # Schedule auto-close for resolved tickets
            auto_close_resolved_tickets.delay(instance.id)
        elif instance.status == "escalated":
            # Handle escalation if needed
            pass

@receiver(pre_save, sender=SupportTicket)
def check_ticket_assignee_change(sender, instance, **kwargs):
    """
    Check if ticket assignee has changed and notify the new assignee
    """
    if instance.pk and instance.assigned_to:
        try:
            old_instance = SupportTicket.objects.get(pk=instance.pk)
            if old_instance.assigned_to != instance.assigned_to:
                # Notify new assignee
                notify_ticket_assigned.delay(instance.id)
        except SupportTicket.DoesNotExist:
            pass