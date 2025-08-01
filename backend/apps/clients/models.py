import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import User
from apps.organization.models import Organization, Salesperson

class Client(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('lead', 'Lead'),
        ('prospect', 'Prospect'),
    ]
    
    SOURCE_CHOICES = [
        ('website', 'Website'),
        ('referral', 'Referral'),
        ('social_media', 'Social Media'),
        ('advertisement', 'Advertisement'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, help_text="Contact person and details", null=True, blank=True)
    salesperson = models.ForeignKey(
        Salesperson, 
        on_delete=models.SET_NULL,
        related_name='clients',
        null=True,
        blank=True
    )
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='lead',
        help_text="Current status of the client"
    )
    source = models.CharField(
        max_length=50, 
        choices=SOURCE_CHOICES, 
        default='other',
        help_text="How the client found out about us"
    )
    notes = models.TextField(blank=True, null=True)
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='clients',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
        
    class Meta:
        ordering = ['-created_at']
