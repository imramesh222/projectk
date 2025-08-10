from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import User
from .tasks import send_welcome_email_task

@receiver(post_save, sender=User)
def send_welcome_email_on_creation(sender, instance, created, **kwargs):
    """
    Signal receiver to send welcome email when a new user is created.
    Includes password in the email if the user was created by an admin/superuser.
    """
    if not created or not getattr(settings, 'SEND_WELCOME_EMAIL', False):
        return
    
    # Check if this is being called from a request context where we have the raw password
    from django.core.signals import request_finished
    from django.dispatch import Signal
    
    # Get the raw password from the instance if it exists (set during user creation)
    raw_password = getattr(instance, '_password', None)
    
    # Check if the current user is an admin/superuser
    User = get_user_model()
    request = getattr(instance, '_request', None)
    
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        is_admin_request = request.user.is_staff or request.user.is_superuser
    else:
        # If no request context, check if this is a superuser creation
        is_admin_request = instance.is_superuser or instance.is_staff
    
    # If this is an admin request and we have a password, include it in the email
    if is_admin_request and raw_password:
        send_welcome_email_task.delay(instance.id, password=raw_password)
    else:
        send_welcome_email_task.delay(instance.id)
