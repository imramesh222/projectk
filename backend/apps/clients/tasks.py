from celery import shared_task
from .models import Client
from apps.notifications.utils import send_notification_to_salesperson

@shared_task
def notify_salesperson_async(client_id):
    try:
        client = Client.objects.get(id=client_id)
        send_notification_to_salesperson(
            user=client.salesperson,
            message=f"[Async] New client '{client.name}' was added."
        )
    except Client.DoesNotExist:
        pass
