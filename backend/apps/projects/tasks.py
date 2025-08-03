from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from .models import Project
from apps.notifications.utils import send_notification
from apps.tasks.models import Task

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3)
def update_project_progress(self, project_id):
    """
    Update project progress based on tasks completion
    """
    try:
        project = Project.objects.get(id=project_id)
        
        # Calculate progress based on tasks
        total_tasks = Task.objects.filter(project=project).count()
        if total_tasks == 0:
            return "No tasks found for project"
            
        completed_tasks = Task.objects.filter(
            project=project,
            status__in=['completed', 'approved']
        ).count()
        
        new_progress = int((completed_tasks / total_tasks) * 100)
        
        # Only update if progress changed
        if project.progress != new_progress:
            project.progress = new_progress
            project.save()
            
            # Log progress update
            logger.info(f"Project {project_id} progress updated to {new_progress}% (status: {project.status})")
            
            logger.info(f"Updated project {project_id} progress to {new_progress}%")
            
        return f"Updated project {project_id} progress to {new_progress}%"
        
    except Exception as e:
        logger.error(f"Error updating project progress {project_id}: {str(e)}")
        raise self.retry(exc=e, countdown=300)  # Retry after 5 minutes

@shared_task
def generate_project_report(project_id):
    """
    Generate a project report asynchronously
    """
    try:
        project = Project.objects.get(id=project_id)
        # Generate report logic here
        logger.info(f"Generated report for project {project_id}")
        return f"Generated report for project {project_id}"
    except Exception as e:
        logger.error(f"Error generating project report {project_id}: {str(e)}")
        raise

@shared_task
def check_project_deadlines():
    """
    Check for upcoming project deadlines and notify stakeholders
    """
    try:
        warning_date = timezone.now() + timezone.timedelta(days=7)  # 7 days before deadline
        upcoming_projects = Project.objects.filter(
            end_date__lte=warning_date,
            end_date__gte=timezone.now(),
            status__in=['planning', 'in_progress']
        )
        
        for project in upcoming_projects:
            # Notify project manager
            if project.manager and project.manager.user:
                send_notification(
                    recipient=project.manager.user,
                    message=f"Project '{project.title}' is approaching its deadline on {project.end_date.strftime('%Y-%m-%d')}",
                    notification_type="project_deadline_approaching"
                )
                
            # Notify team members
            team_members = project.team_members.all()
            for member in team_members:
                if member.user:
                    send_notification(
                        recipient=member.user,
                        message=f"Project '{project.title}' deadline is approaching on {project.end_date.strftime('%Y-%m-%d')}",
                        notification_type="project_deadline_reminder"
                    )
        
        return f"Checked deadlines for {upcoming_projects.count()} projects"
        
    except Exception as e:
        logger.error(f"Error checking project deadlines: {str(e)}")
        raise
