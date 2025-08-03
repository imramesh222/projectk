#!/usr/bin/env python
"""
Test script for verifying task-related signals.
Run with: python manage.py shell < test_signals.py
"""
import os
import django
import sys
from datetime import timedelta
from django.utils import timezone

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models after Django setup
from django.contrib.auth import get_user_model
User = get_user_model()

from apps.organization.models import Organization, Developer, Salesperson, ProjectManager
from apps.projects.models import Project
from apps.clients.models import Client
from apps.tasks.models import Task

print("Django environment loaded successfully!")

def test_task_signals():
    print("Starting test_task_signals...")
    
    # Get or create a test user
    username = f'testuser_{timezone.now().strftime("%Y%m%d%H%M%S")}'
    email = f'{username}@example.com'
    
    try:
        user = User.objects.get(username='testuser')
        print("Using existing test user")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='developer'
        )
        print("Created new test user")
    
    # Get or create a test project
    # Create or get organization
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(name="Test Organization")
    
    # Create or get client
    client = Client.objects.first()
    if not client:
        client = Client.objects.create(
            name="Test Client",
            organization=org,
            contact_person="Test Contact",
            email="client@example.com",
            phone="+1234567890"
        )
    
    # Create or get salesperson user
    salesperson_user = User.objects.filter(role='salesperson').first()
    if not salesperson_user:
        salesperson_user = User.objects.create_user(
            username='testsales',
            email='sales@example.com',
            password='testpass123',
            role='salesperson'
        )
    
    # Create or get salesperson
    salesperson = Salesperson.objects.first()
    if not salesperson:
        salesperson = Salesperson.objects.create(
            user=salesperson_user,
            organization=org
        )
    
    # Create or get project manager user
    pm_user = User.objects.filter(role='project_manager').first()
    if not pm_user:
        pm_user = User.objects.create_user(
            username='testpm',
            email='pm@example.com',
            password='testpass123',
            role='project_manager'
        )
    
    # Create or get project manager
    project_manager = ProjectManager.objects.first()
    if not project_manager:
        project_manager = ProjectManager.objects.create(
            user=pm_user,
            organization=org
        )
    
    # Create or get project
    project = Project.objects.first()
    if not project:
        project = Project.objects.create(
            title="Test Project",
            description="Test project description",
            status='planning',
            cost=1000.00,
            client=client,
            start_date=timezone.now().date(),
            deadline=timezone.now().date() + timedelta(days=30)
        )
        # Add related objects after creation
        project.salesperson = salesperson
        project.project_manager = project_manager
        project.save()
    
    # Create or get developer user
    dev_user = User.objects.filter(role='developer').first()
    if not dev_user:
        dev_user = User.objects.create_user(
            username='testdev',
            email='dev@example.com',
            password='testpass123',
            role='developer'
        )
    
    # Ensure user is a Developer
    developer, created = Developer.objects.get_or_create(
        user=dev_user,
        organization=org
    )
    
    print("Testing task creation...")
    # Test task creation
    task = Task.objects.create(
        title="Test Task",
        description="This is a test task",
        status='pending',  # Using valid status from choices
        priority='medium',
        developer=developer,
        project=project,
        due_date=timezone.now() + timedelta(days=2)  # Using due_date instead of deadline
    )
    print(f"Created task: {task.title} (ID: {task.id})")
    
    # Test status update
    print("\nTesting task status update...")
    task.status = 'in_progress'
    task.save()
    print(f"Updated task status to: {task.get_status_display()}")
    
    # Test due date notification (set due_date to 23 hours from now)
    print("\nTesting due date notification...")
    task.due_date = timezone.now() + timedelta(hours=23)
    task.save()
    print(f"Updated task due date to: {task.due_date}")
    
    print("\nSignal tests completed! Check your notifications in the admin panel or console output.")

if __name__ == "__main__":
    print("Running test_signals.py as main script")
    try:
        test_task_signals()
        print("Test completed successfully!")
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
