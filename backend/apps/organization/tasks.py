from celery import shared_task
from django.core.mail import send_mail
from apps.users.models import User

@shared_task
def send_admin_assignment_email(user_id, org_name):
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject='Admin Assignment Notification',
            message=f"You have been assigned as an admin to {org_name}. Please check your dashboard.",
            from_email='no-reply@devsync.com',
            recipient_list=[user.email]
        )
    except User.DoesNotExist:
        pass
