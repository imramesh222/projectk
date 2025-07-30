import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_notification_to_admin(user, message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user.id}",
        {
            'type': 'send_notification',
            'message': message,
        }
    )
def send_notification_to_salesperson(user, message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user.id}",
        {
            'type': 'send_notification',
            'message': message,
            # Add any salesperson-specific logic here
        }
    )