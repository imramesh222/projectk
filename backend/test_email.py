import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.mail import send_mail

def test_email():
    try:
        send_mail(
            'Test Email from Django',
            'This is a test email sent from Django using SMTP.',
            None,  # Uses DEFAULT_FROM_EMAIL from settings
            ['test@example.com'],  # Replace with your test email
            fail_silently=False,
        )
        print("Email sent successfully! Check your Mailtrap inbox.")
    except Exception as e:
        print(f"Error sending email: {e}")

if __name__ == "__main__":
    test_email()
