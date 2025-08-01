# apps/payments/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Payment
from .tasks import process_payment_async, send_payment_reminder
from django.db import transaction

@receiver(post_save, sender=Payment)
def handle_payment_notifications(sender, instance, created, **kwargs):
    """
    Handle payment notifications via Celery tasks
    """
    if created and instance.client:
        # Process payment asynchronously
        process_payment_async.delay(instance.id)
        
        # Schedule payment reminder for due date
        if instance.due_date:
            # Calculate seconds until due date (for demo, using 1 minute before due)
            # In production, you might want to schedule this for 1 day before due
            send_payment_reminder.apply_async(
                args=[instance.id],
                eta=instance.due_date
            )

@receiver(pre_save, sender=Payment)
def log_payment_status_change(sender, instance, **kwargs):
    """
    Log payment status changes
    """
    if instance.pk:  # Only for updates
        try:
            old_instance = Payment.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Log status change or trigger additional actions
                pass
        except Payment.DoesNotExist:
            pass