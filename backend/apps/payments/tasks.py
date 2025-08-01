from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from .models import Payment
from apps.notifications.utils import send_notification

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3)
def process_payment_async(self, payment_id):
    """
    Process payment asynchronously
    """
    try:
        payment = Payment.objects.get(id=payment_id)
        # Simulate payment processing
        payment.status = 'completed'
        payment.paid_at = timezone.now()
        payment.save()
        
        # Send payment confirmation
        if payment.client and payment.client.user:
            send_notification(
                recipient=payment.client.user,
                message=f"Payment of ${payment.amount} has been processed successfully.",
                notification_type="payment_processed"
            )
            
        logger.info(f"Payment {payment_id} processed successfully")
        return f"Payment {payment_id} processed"
        
    except Exception as e:
        logger.error(f"Error processing payment {payment_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)  # Retry after 60 seconds

@shared_task
def send_payment_reminder():
    """
    Send payment reminders for upcoming or overdue payments
    """
    try:
        # Find payments due in the next 3 days
        reminder_date = timezone.now() + timezone.timedelta(days=3)
        upcoming_payments = Payment.objects.filter(
            due_date__lte=reminder_date,
            status='pending'
        )
        
        for payment in upcoming_payments:
            if payment.client and payment.client.user:
                send_notification(
                    recipient=payment.client.user,
                    message=f"Reminder: Payment of ${payment.amount} is due on {payment.due_date.strftime('%Y-%m-%d')}",
                    notification_type="payment_reminder"
                )
                
        return f"Sent {upcoming_payments.count()} payment reminders"
        
    except Exception as e:
        logger.error(f"Error sending payment reminders: {str(e)}")
        raise
