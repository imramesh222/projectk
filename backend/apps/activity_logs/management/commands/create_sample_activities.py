from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.text import slugify
from apps.activity_logs.models import ActivityLog, ActivityType
from apps.organization.models import Organization, OrganizationStatusChoices

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample activity logs for testing purposes'

    def handle(self, *args, **options):
        # Get or create a superuser for the activities
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_superuser': True,
                'is_staff': True,
                'is_active': True
            }
        )
        
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Get or create an organization
        org_name = 'Test Organization'
        org_slug = slugify(org_name)
        org, _ = Organization.objects.get_or_create(
            name=org_name,
            defaults={
                'slug': org_slug,
                'email': 'test@example.com',
                'status': OrganizationStatusChoices.ACTIVE,
                'max_users': 10,
                'max_storage': 100
            }
        )

        # Sample activities
        activities = [
            {
                'user': user,
                'activity_type': ActivityType.LOGIN,
                'object_type': 'user',
                'object_id': str(user.id),
                'details': {'message': 'User logged in'},
                'ip_address': '127.0.0.1',
                'created_at': timezone.now() - timezone.timedelta(minutes=5)
            },
            {
                'user': user,
                'activity_type': ActivityType.CREATE,
                'object_type': 'user',
                'object_id': str(user.id),
                'details': {'message': 'New user created'},
                'ip_address': '127.0.0.1',
                'created_at': timezone.now() - timezone.timedelta(hours=1)
            },
            {
                'user': user,
                'activity_type': ActivityType.CREATE,
                'object_type': 'organization',
                'object_id': str(org.id),
                'details': {'message': 'New organization created'},
                'ip_address': '127.0.0.1',
                'created_at': timezone.now() - timezone.timedelta(hours=2)
            },
            {
                'user': user,
                'activity_type': ActivityType.CREATE,
                'object_type': 'project',
                'object_id': '1',
                'details': {'message': 'New project created'},
                'ip_address': '127.0.0.1',
                'created_at': timezone.now() - timezone.timedelta(days=1)
            },
            {
                'user': user,
                'activity_type': ActivityType.CREATE,
                'object_type': 'task',
                'object_id': '1',
                'details': {'message': 'New task created'},
                'ip_address': '127.0.0.1',
                'created_at': timezone.now() - timezone.timedelta(days=2)
            }
        ]

        # Create activities
        for activity_data in activities:
            ActivityLog.objects.create(**activity_data)

        self.stdout.write(self.style.SUCCESS('Successfully created sample activities'))
