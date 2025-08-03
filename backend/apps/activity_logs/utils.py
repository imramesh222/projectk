from django.contrib.auth import get_user_model
from django.utils import timezone
from ipware import get_client_ip

from .models import ActivityLog, ActivityType

User = get_user_model()

def log_activity(
    user=None,
    activity_type=ActivityType.UPDATE,
    request=None,
    object_type=None,
    object_id=None,
    details=None
):
    """
    Log an activity to the database.
    
    Args:
        user: The user performing the action (can be None for system actions)
        activity_type: Type of activity from ActivityType
        request: The request object (optional, used to get IP and user agent)
        object_type: Type of the object being acted upon (e.g., 'User', 'Project')
        object_id: ID of the object being acted upon
        details: Additional details about the activity (will be stored as JSON)
    """
    ip_address = None
    user_agent = None
    
    if request:
        ip_address, _ = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        if not user and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
    
    activity = ActivityLog.objects.create(
        user=user if user and user.is_authenticated else None,
        activity_type=activity_type,
        ip_address=ip_address,
        user_agent=user_agent,
        object_type=object_type,
        object_id=str(object_id) if object_id else None,
        details=details or {}
    )
    
    return activity
