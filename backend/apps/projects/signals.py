# apps/projects/signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from .models import Project
from .tasks import update_project_progress, check_project_deadlines, generate_project_report

@receiver(post_save, sender=Project)
def handle_project_updates(sender, instance, created, **kwargs):
    """
    Handle project-related updates and notifications via Celery tasks
    """
    if created:
        # For new projects, schedule a progress update
        update_project_progress.delay(instance.id)
        
        # Schedule deadline check for new projects
        if instance.deadline:
            check_project_deadlines.delay()
    else:
        # For updates, check if important fields changed
        if instance.tracker.has_changed('status'):
            update_project_progress.delay(instance.id)
            
            # If project is marked as completed, generate a report
            if instance.status == 'completed':
                generate_project_report.delay(instance.id)

@receiver(post_delete, sender=Project)
def cleanup_after_project_deletion(sender, instance, **kwargs):
    """
    Handle cleanup after project deletion
    """
    # Any necessary cleanup can be done here
    # For example, cleaning up related files or temporary data
    pass