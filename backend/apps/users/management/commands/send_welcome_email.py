from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.tasks import send_welcome_email_task

User = get_user_model()

class Command(BaseCommand):
    help = 'Send a welcome email to an existing user'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to send welcome email to')

    def handle(self, *args, **options):
        email = options['email']
        try:
            user = User.objects.get(email=email)
            self.stdout.write(self.style.SUCCESS(f'Sending welcome email to {email}...'))
            send_welcome_email_task.delay(user.id)
            self.stdout.write(self.style.SUCCESS('Welcome email queued successfully!'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} does not exist'))
