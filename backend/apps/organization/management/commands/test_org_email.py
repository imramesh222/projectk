from django.core.management.base import BaseCommand
from django.conf import settings
from apps.organization.models import Organization
from apps.organization.tasks import send_organization_created_email

class Command(BaseCommand):
    help = 'Test sending organization creation email'

    def handle(self, *args, **options):
        self.stdout.write("Testing organization creation email...")
        
        # Print email settings
        self.stdout.write(f"Email Backend: {getattr(settings, 'EMAIL_BACKEND', 'Not set')}")
        self.stdout.write(f"Email Host: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
        self.stdout.write(f"Email Port: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
        self.stdout.write(f"Email Use TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
        self.stdout.write(f"Default From Email: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')}")
        
        # Create a test organization with a unique name
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        org_name = f"Test Email Org {timestamp}"
        org = Organization.objects.create(
            name=org_name,
            email=f"test+{timestamp}@example.com"
        )
        
        self.stdout.write(f"Created test organization: {org.name} (ID: {org.id})")
        
        # Test sending email directly
        self.stdout.write("Sending test email...")
        try:
            result = send_organization_created_email(org.id)
            self.stdout.write(self.style.SUCCESS(f"Email task result: {result}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error sending email: {str(e)}"))
        
        # Also test the Celery task
        self.stdout.write("Sending test email via Celery...")
        try:
            task = send_organization_created_email.delay(org.id)
            self.stdout.write(self.style.SUCCESS(f"Celery task ID: {task.id}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error queuing Celery task: {str(e)}"))
