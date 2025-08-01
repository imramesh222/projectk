from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

def send_welcome_email(user):
    """
    Send a welcome email to the newly registered user
    """
    subject = 'Welcome to Our Platform!'
    
    # Render HTML email template
    html_message = render_to_string('emails/welcome_email.html', {
        'user': user,
        'login_url': f'{settings.FRONTEND_URL}/login',
    })
    
    # Create plain text version
    text_message = strip_tags(html_message)
    
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
            reply_to=[settings.REPLY_TO_EMAIL]
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
        return False
