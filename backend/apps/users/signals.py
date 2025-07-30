from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.core.mail import send_mail
from .models import User


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        subject = "Welcome to DevSync"
        message = f"Hi {instance.username}, you have been registered as {instance.role}."
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [instance.email]

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            # Log the error or handle it as needed
            print(f"Error sending welcome email: {e}")