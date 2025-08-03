from datetime import timedelta
from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Task
from apps.notifications.utils import send_notification

logger = get_task_logger(__name__)
User = get_user_model()

@shared_task(bind=True, max_retries=3)
def notify_task_assigned(self, task_id):
    """
    Send notification when a task is assigned to a developer
    """
    try:
        task = Task.objects.get(id=task_id)
        if task.developer and task.developer.user:
            send_notification(
                recipient=task.developer.user,
                message=f"New task assigned: {task.title}",
                notification_type="task_assigned"
            )
            logger.info(f"Notification sent for task assignment: {task_id}")
    except Task.DoesNotExist as exc:
        logger.error(f"Task {task_id} not found: {exc}")
        raise self.retry(exc=exc, countdown=60)
    except Exception as exc:
        logger.error(f"Error in notify_task_assigned: {exc}")
        raise self.retry(exc=exc, countdown=60)

@shared_task
def notify_task_status_update(task_id, old_status, new_status):
    """
    Send notification when task status is updated
    """
    try:
        task = Task.objects.get(id=task_id)
        if task.developer and task.developer.user:
            send_notification(
                recipient=task.developer.user,
                message=f"Task status updated from {old_status} to {new_status}: {task.title}",
                notification_type="task_status_update"
            )
            logger.info(f"Status update notification sent for task: {task_id}")
    except Task.DoesNotExist:
        logger.error(f"Task {task_id} not found for status update notification")
    except Exception as e:
        logger.error(f"Error in notify_task_status_update: {e}")

@shared_task
def check_task_deadlines():
    """
    Check for tasks with approaching deadlines and send notifications
    This task should be scheduled to run daily
    """
    try:
        soon = timezone.now() + timezone.timedelta(hours=24)
        tasks = Task.objects.filter(
            due_date__lte=soon,
            due_date__gt=timezone.now(),
            status__in=['pending', 'in_progress']
        )
        
        for task in tasks:
            if task.developer and task.developer.user:
                send_notification(
                    recipient=task.developer.user,
                    message=f"Task '{task.title}' is due soon! (Due: {task.due_date.strftime('%Y-%m-%d %H:%M')})",
                    notification_type="deadline_approaching"
                )
                logger.info(f"Deadline notification sent for task: {task.id}")
        
        return f"Checked {tasks.count()} tasks for deadlines"
    except Exception as e:
        logger.error(f"Error in check_task_deadlines: {e}")
        raise

@shared_task
def test_task_signals():
    """
    Test task signals and notifications
    This is for development/testing purposes only
    """
    try:
        # Get or create a test organization
        from apps.organization.models import Organization
        org = Organization.objects.first()
        if not org:
            org = Organization.objects.create(name="Test Organization")
            print(f"Created test organization: {org.name}")

        # Get or create a test client
        from apps.clients.models import Client
        client = Client.objects.first()
        if not client:
            client = Client.objects.create(
                name="Test Client",
                organization=org,
                contact_person="Test Contact",
                email="test@example.com"
            )
            print("Created test client")

        # Get or create a test project
        from apps.projects.models import Project
        project = Project.objects.first()
        if not project:
            project = Project.objects.create(
                title="Test Project",
                description="Test project for signal testing",
                status='planning',
                client=client
            )
            print("Created test project")

        # Get or create a test developer
        from apps.organization.models import Developer
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        dev_user = User.objects.filter(role='developer').first()
        if not dev_user:
            dev_user = User.objects.create_user(
                username='testdev',
                email='dev@example.com',
                password='testpass123',
                role='developer'
            )
            print("Created test developer user")
        
        developer, created = Developer.objects.get_or_create(
            user=dev_user,
            organization=org
        )
        if created:
            print("Created test developer profile")

        # Now create the test task with all required fields
        task = Task.objects.create(
            title="Test Task",
            description="This is a test task created by Celery",
            status='pending',
            priority='medium',
            developer=developer,
            project=project,  # Make sure to include the project
            due_date=timezone.now() + timedelta(days=1)
        )
        print(f"Created test task: {task.id}")

        # Test status update
        task.status = 'in_progress'
        task.save()
        print("Updated task status")

        # Test deadline notification
        task.due_date = timezone.now() + timedelta(hours=23)
        task.save()
        print("Updated task due date")

        return "Task signal tests completed successfully"
    except Exception as e:
        print(f"Error in test_task_signals: {str(e)}")
        raise