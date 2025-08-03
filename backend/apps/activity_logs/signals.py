from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone

from .models import ActivityLog,ActivityType
from .utils import log_activity

User = get_user_model()

@receiver(post_save, sender=User)
def log_user_activity(sender, instance, created, **kwargs):
    """Log user creation and updates."""
    if created:
        log_activity(
            user=instance,
            activity_type=ActivityType.CREATE,
            object_type='User',
            object_id=instance.id,
            details={
                'username': instance.username,
                'email': instance.email,
                'first_name': instance.first_name,
                'last_name': instance.last_name,
                'is_active': instance.is_active,
                'is_staff': instance.is_staff,
                'is_superuser': instance.is_superuser,
            }
        )
    else:
        # Log user updates
        if hasattr(instance, '_password_changed') and instance._password_changed:
            log_activity(
                user=instance,
                activity_type=ActivityType.PASSWORD_CHANGE,
                object_type='User',
                object_id=instance.id,
                details={
                    'username': instance.username,
                    'password_changed_at': timezone.now().isoformat()
                }
            )
        
        # Log profile updates
        log_activity(
            user=instance,
            activity_type=ActivityType.PROFILE_UPDATE,
            object_type='User',
            object_id=instance.id,
            details={
                'username': instance.username,
                'updated_fields': getattr(instance, '_updated_fields', [])
            }
        )

@receiver(post_save)
def log_model_activity(sender, instance, created, **kwargs):
    """Log generic model creation and updates."""
    # Skip logging for these models
    if sender._meta.app_label in ['sessions', 'admin', 'contenttypes', 'auth', 'authtoken']:
        return
    
    # Skip logging for ActivityLog itself to avoid infinite recursion
    if sender == ActivityLog:
        return
    
    model_name = sender.__name__
    
    if created:
        activity_type = ActivityType.CREATE
        details = {}
    else:
        activity_type = ActivityType.UPDATE
        # Get changed fields if available
        if hasattr(instance, '_updated_fields'):
            details = {field: getattr(instance, field, None) 
                     for field in instance._updated_fields 
                     if field not in ['last_login', 'updated_at']}
        else:
            details = {}
    
    log_activity(
        user=getattr(instance, 'user', None) or getattr(instance, 'created_by', None),
        activity_type=activity_type,
        object_type=model_name,
        object_id=instance.id,
        details=details
    )

@receiver(post_delete)
def log_model_deletion(sender, instance, **kwargs):
    """Log model deletions."""
    # Skip logging for these models
    if sender._meta.app_label in ['sessions', 'admin', 'contenttypes', 'auth', 'authtoken']:
        return
    
    # Skip logging for ActivityLog itself to avoid infinite recursion
    if sender == ActivityLog:
        return
    
    model_name = sender.__name__
    
    log_activity(
        user=getattr(instance, 'user', None) or getattr(instance, 'created_by', None),
        activity_type=ActivityType.DELETE,
        object_type=model_name,
        object_id=instance.id,
        details={
            'deleted_at': timezone.now().isoformat(),
            'deleted_object': str(instance)
        }
    )
