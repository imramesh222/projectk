import uuid
from django.db import models
from django.utils import timezone
from apps.organization.models import OrganizationMember
from apps.projects.models import Project
from apps.clients.models import Client

class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issue = models.CharField(
        max_length=255, 
        help_text="Brief description of the issue",
        default='No issue description provided',
        blank=True
    )
    description = models.TextField(help_text="Detailed description of the issue")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='open',
        help_text="Current status of the ticket"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='medium',
        help_text="Priority level of the ticket"
    )
    support = models.ForeignKey(
        OrganizationMember, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='support_tickets',
        help_text="Support staff assigned to this ticket"
    )
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='support_tickets',
        help_text="Client who raised the ticket"
    )
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='support_tickets',
        null=True,
        blank=True,
        help_text="Related project (if applicable)"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.issue} ({self.get_status_display()})"
        
    class Meta:
        ordering = ['-priority', 'created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['created_at']),
        ]

    def save(self, *args, **kwargs):
        # Update timestamps based on status changes
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
        if self.status == 'closed' and not self.closed_at:
            self.closed_at = timezone.now()
        super().save(*args, **kwargs)