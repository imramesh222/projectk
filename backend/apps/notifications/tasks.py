from celery import shared_task
from .models import Notification
from django.contrib.auth import get_user_model

@shared_task
def create_notification(recipient_id, message):
    User = get_user_model()
    user = User.objects.get(id=recipient_id)
    Notification.objects.create(recipient=user, message=message)
