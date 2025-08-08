import logging
from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Set up logger
logger = get_task_logger(__name__)

@shared_task
def send_admin_assignment_email(user_id, org_name):
    from apps.users.models import User
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject='Admin Assignment Notification',
            message=f"You have been assigned as an admin to {org_name}. Please check your dashboard.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email]
        )
    except User.DoesNotExist:
        pass

@shared_task(name='apps.organization.tasks.send_organization_created_email', bind=True)
def send_organization_created_email(self, org_id, context=None):
    """
    Send an email notification when a new organization is created.
    
    Args:
        org_id: The ID of the organization
        context: Additional context for the email template
    """
    from .models import Organization
    
    logger.info(f"Starting to process organization email for org_id: {org_id}")
    
    try:
        organization = Organization.objects.get(id=org_id)
        logger.info(f"Found organization: {organization.name} (ID: {organization.id})")
        
        # Default context
        if context is None:
            context = {}
            
        # Update context with organization details
        context.update({
            'organization_name': organization.name,
            'organization_plan': organization.get_plan_display(),
            'organization_status': organization.get_status_display(),
            'max_users': organization.max_users,
            'max_storage': organization.max_storage,
            'site_name': getattr(settings, 'SITE_NAME', 'Our Platform'),
            'dashboard_url': getattr(settings, 'FRONTEND_DASHBOARD_URL', 'https://yourapp.com/dashboard'),
            'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@example.com'),
        })
        
        logger.info(f"Email context prepared: {context}")
        
        # Check if organization has an email
        if not organization.email:
            logger.error(f"Organization {organization.name} (ID: {organization.id}) has no email address configured")
            return False
            
        # Render email content
        subject = f"Your {context['site_name']} Organization Has Been Created"
        
        # Render HTML and text versions
        try:
            html_content = render_to_string('emails/organization_created.html', context)
            text_content = strip_tags(render_to_string('emails/organization_created.txt', context))
            logger.info("Email templates rendered successfully")
        except Exception as e:
            logger.error(f"Error rendering email templates: {str(e)}")
            raise
        
        # Get email settings
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
        to_email = organization.email
        
        logger.info(f"Preparing to send email to: {to_email} from: {from_email}")
        
        # Create email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email],
            reply_to=[getattr(settings, 'SUPPORT_EMAIL', 'support@example.com')]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # Send email
        try:
            msg.send(fail_silently=False)
            logger.info(f"Successfully sent organization creation email to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            raise
        
    except Organization.DoesNotExist as e:
        logger.error(f"Organization with ID {org_id} does not exist: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
    except Exception as e:
        logger.error(f"Unexpected error in send_organization_created_email: {str(e)}", exc_info=True)
        raise self.retry(exc=e, countdown=60, max_retries=3)
