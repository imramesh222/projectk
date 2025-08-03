# apps/tasks/signals.py
import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Task
from . import tasks  # Import Celery tasks

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Task)
def handle_task_updates(sender, instance, created, **kwargs):
    """
    Handle task updates and delegate to Celery tasks for async processing
    """
    try:
        if not instance.developer or not hasattr(instance.developer, 'user'):
            logger.debug(f"Skipping task {instance.id} - no developer or user assigned")
            return
        
        if created:
            logger.info(f"New task created: {instance.id}, queueing assignment notification")
            tasks.notify_task_assigned.delay(str(instance.id))
        elif hasattr(instance, 'tracker') and instance.tracker.has_changed('status'):
            # Queue status update notification
            old_status = instance.tracker.previous('status')
            logger.info(f"Task {instance.id} status changed from {old_status} to {instance.status}")
            tasks.notify_task_status_update.delay(
                str(instance.id),
                old_status,
                instance.status
            )
    except Exception as e:
        logger.error(f"Error in handle_task_updates for task {getattr(instance, 'id', 'unknown')}: {str(e)}", 
                   exc_info=True)

@receiver(pre_save, sender=Task)
def check_deadline(sender, instance, **kwargs):
    """
    Check for approaching deadlines and notify
    Note: This is a lightweight check. The main deadline checking is done
    by the scheduled Celery task check_task_deadlines()
    """
    try:
        if not instance.developer or not hasattr(instance.developer, 'user'):
            return  # Skip if no developer assigned
        
        if not hasattr(instance, 'tracker'):
            logger.debug("FieldTracker not available for Task model")
            return
            
        due_date = getattr(instance, 'due_date', None)
        if not due_date:
            return
            
        is_deadline_approaching = (
            due_date < timezone.now() + timedelta(days=1) and
            instance.status in ['pending', 'in_progress'] and
            (not instance.tracker.previous('due_date') or 
             instance.tracker.previous('due_date') != due_date)
        )
        
        if is_deadline_approaching:
            logger.info(f"Task {instance.id} deadline is approaching: {due_date}")
            tasks.notify_task_status_update.delay(
                str(instance.id),
                "",
                f"deadline_approaching:{due_date.isoformat()}"
            )
    except Exception as e:
        logger.error(f"Error in check_deadline for task {getattr(instance, 'id', 'unknown')}: {str(e)}", 
                   exc_info=True)