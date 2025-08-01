from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from .models import SupportTicket
from apps.notifications.utils import send_notification

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3)
def notify_ticket_assigned(self, ticket_id):
    """
    Send notification when a support ticket is assigned to an agent
    """
    try:
        ticket = SupportTicket.objects.get(id=ticket_id)
        if ticket.assigned_to and ticket.assigned_to.user:
            send_notification(
                recipient=ticket.assigned_to.user,
                message=f"New support ticket assigned: {ticket.title}",
                notification_type="ticket_assigned"
            )
            logger.info(f"Notification sent for ticket assignment: {ticket_id}")
        return f"Processed ticket assignment for {ticket_id}"
    except Exception as e:
        logger.error(f"Error notifying ticket assignment {ticket_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)

@shared_task
def escalate_overdue_tickets():
    """
    Check for overdue tickets and escalate them if needed
    """
    try:
        overdue_tickets = SupportTicket.objects.filter(
            status__in=['open', 'in_progress'],
            due_date__lt=timezone.now()
        )
        
        for ticket in overdue_tickets:
            # Escalate the ticket
            ticket.priority = 'high'
            ticket.status = 'escalated'
            ticket.save()
            
            # Notify manager
            if ticket.assigned_to and ticket.assigned_to.manager:
                send_notification(
                    recipient=ticket.assigned_to.manager.user,
                    message=f"Ticket #{ticket.id} has been escalated: {ticket.title}",
                    notification_type="ticket_escalated"
                )
                
        return f"Escalated {overdue_tickets.count()} overdue tickets"
        
    except Exception as e:
        logger.error(f"Error escalating overdue tickets: {str(e)}")
        raise

@shared_task
def auto_close_resolved_tickets():
    """
    Automatically close tickets marked as resolved after a certain period
    """
    try:
        close_date = timezone.now() - timezone.timedelta(days=7)  # 7 days after resolution
        tickets_to_close = SupportTicket.objects.filter(
            status='resolved',
            updated_at__lte=close_date
        )
        
        for ticket in tickets_to_close:
            ticket.status = 'closed'
            ticket.closed_at = timezone.now()
            ticket.save()
            
            if ticket.created_by:
                send_notification(
                    recipient=ticket.created_by,
                    message=f"Your ticket has been closed: {ticket.title}",
                    notification_type="ticket_closed"
                )
                
        return f"Auto-closed {tickets_to_close.count()} resolved tickets"
        
    except Exception as e:
        logger.error(f"Error auto-closing resolved tickets: {str(e)}")
        raise
