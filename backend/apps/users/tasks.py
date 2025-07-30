from celery import shared_task
from django.core.mail import send_mail, send_mass_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from django.utils.html import strip_tags

User = get_user_model()

@shared_task
def send_async_email(subject, message, to_email, html_message=None):
    """Send a single email asynchronously."""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        html_message=html_message,
        fail_silently=False,
    )

@shared_task
def send_daily_digest():
    """Send daily digest to all active users."""
    users = User.objects.filter(is_active=True, email_notifications=True)
    
    # Get new signups in the last 24 hours
    new_users = User.objects.filter(
        date_joined__gte=timezone.now() - timedelta(days=1)
    ).count()
    
    subject = "Your Daily Digest"
    
    for user in users:
        context = {
            'user': user,
            'new_users': new_users,
            'date': timezone.now().strftime('%Y-%m-%d'),
        }
        
        # Render HTML email
        html_message = render_to_string('emails/daily_digest.html', context)
        plain_message = strip_tags(html_message)
        
        send_async_email.delay(
            subject=subject,
            message=plain_message,
            to_email=user.email,
            html_message=html_message
        )

@shared_task
def send_weekly_summary():
    """Send weekly summary to all active users."""
    users = User.objects.filter(is_active=True, email_notifications=True)
    
    # Get stats for the past week
    week_ago = timezone.now() - timedelta(weeks=1)
    new_users_week = User.objects.filter(
        date_joined__gte=week_ago
    ).count()
    
    subject = "Your Weekly Summary"
    
    for user in users:
        context = {
            'user': user,
            'new_users': new_users_week,
            'start_date': week_ago.strftime('%Y-%m-%d'),
            'end_date': timezone.now().strftime('%Y-%m-%d'),
        }
        
        html_message = render_to_string('emails/weekly_summary.html', context)
        plain_message = strip_tags(html_message)
        
        send_async_email.delay(
            subject=subject,
            message=plain_message,
            to_email=user.email,
            html_message=html_message
        )

@shared_task
def check_inactive_users():
    """Check for inactive users and send reminder emails."""
    thirty_days_ago = timezone.now() - timedelta(days=30)
    inactive_users = User.objects.filter(
        last_login__lte=thirty_days_ago,
        is_active=True,
        email_notifications=True
    )
    
    for user in inactive_users:
        subject = "We Miss You! Come Back to Our Platform"
        context = {'user': user}
        
        html_message = render_to_string('emails/inactive_reminder.html', context)
        plain_message = strip_tags(html_message)
        
        send_async_email.delay(
            subject=subject,
            message=plain_message,
            to_email=user.email,
            html_message=html_message
        )
