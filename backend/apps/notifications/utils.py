import json
from datetime import datetime
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

def send_notification(recipient, message, **kwargs):
    """
    Send a notification to a user via WebSocket and optionally email
    
    Args:
        recipient: The user to notify (User instance)
        message: The notification message
        **kwargs: Additional arguments (for backward compatibility)
            - notification_type: Type of notification (ignored)
            - data: Additional data (included in message if needed)
            - send_email: Whether to send an email notification as well
    
    Returns:
        Notification: The created notification object
    """
    send_email = kwargs.pop('send_email', False)
    data = kwargs.pop('data', {})
    
    # Include additional data in the message if provided
    full_message = message
    if data:
        full_message = f"{message}\n\nAdditional details: {data}"
    
    # Create notification in database
    notification = Notification.objects.create(
        recipient=recipient,
        message=full_message
    )
    
    # Send WebSocket notification if channels is configured
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}", {
                'type': 'send_notification',
                'message': full_message,
                'timestamp': timezone.now().isoformat()
            }
        )
    except Exception as e:
        print(f"WebSocket notification error: {e}")
    
    # Send email if requested
    if send_email:
        send_notification_email(recipient, full_message, 'info')
    
    return notification

def send_notification_to_admin(user, message, **kwargs):
    """Legacy function - now uses the main send_notification"""
    return send_notification(user, message, notification_type='admin', **kwargs)

def send_notification_to_salesperson(user, message, **kwargs):
    """Legacy function - now uses the main send_notification"""
    return send_notification(user, message, notification_type='sales', **kwargs)

def send_notification_email(user, message, notification_type='info'):
    """
    Send an email notification to a user
    
    Args:
        user: The user to notify
        message: The email message content
        notification_type: Type of notification (for email subject/formatting)
    """
    # TODO: Implement email sending logic
    # This is a placeholder - you'll need to implement your email sending logic here
    # using Django's send_mail or a third-party service
    pass

def notify_user_about_task(user, task, action='created', **kwargs):
    """Helper function for task-related notifications"""
    messages = {
        'created': f"New task assigned: {task.title}",
        'updated': f"Task updated: {task.title}",
        'completed': f"Task completed: {task.title}",
        'overdue': f"Task overdue: {task.title}"
    }
    return send_notification(
        user=user,
        message=messages.get(action, f"Task {action}: {task.title}"),
        notification_type=f'task_{action}',
        data={
            'task_id': str(task.id),
            'task_title': task.title,
            'action': action,
            **kwargs
        }
    )