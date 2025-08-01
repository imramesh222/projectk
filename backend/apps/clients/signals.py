from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Client
from .tasks import notify_salesperson_async

@receiver(post_save, sender=Client)
def notify_salesperson_on_client_creation(sender, instance, created, **kwargs):
    if created and instance.salesperson:
        # Delegate to Celery task for async processing
        notify_salesperson_async.delay(instance.id)
