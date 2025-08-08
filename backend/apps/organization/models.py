import uuid
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from apps.users.models import User

class OrganizationRoleChoices(models.TextChoices):
    USER = 'user', _('User')  # Default role for new organization members
    ADMIN = 'admin', _('Admin')
    SALESPERSON = 'salesperson', _('Salesperson')
    VERIFIER = 'verifier', _('Verifier')
    PROJECT_MANAGER = 'project_manager', _('Project Manager')
    DEVELOPER = 'developer', _('Developer')
    SUPPORT = 'support', _('Support')

class OrganizationMember(models.Model):
    """
    Tracks a user's role within an organization
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organization_memberships')
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE, related_name='members')
    role = models.CharField(
        max_length=32,
        choices=OrganizationRoleChoices.choices,
        default=OrganizationRoleChoices.USER
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'organization')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()}) at {self.organization.name}"

class OrganizationStatusChoices(models.TextChoices):
    ACTIVE = 'active', _('Active')
    TRIAL = 'trial', _('Trial')
    SUSPENDED = 'suspended', _('Suspended')
    INACTIVE = 'inactive', _('Inactive')

class OrganizationPlanChoices(models.TextChoices):
    FREE = 'free', _('Free')
    BASIC = 'basic', _('Basic')
    PRO = 'pro', _('Pro')
    ENTERPRISE = 'enterprise', _('Enterprise')

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='organization_logos/', blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # New fields to match frontend
    status = models.CharField(
        max_length=20,
        choices=OrganizationStatusChoices.choices,
        default=OrganizationStatusChoices.ACTIVE
    )
    plan = models.CharField(
        max_length=20,
        choices=OrganizationPlanChoices.choices,
        default=OrganizationPlanChoices.FREE
    )
    max_users = models.PositiveIntegerField(
        default=10,
        help_text='Maximum number of users allowed for this organization'
    )
    max_storage = models.PositiveIntegerField(
        default=10,
        help_text='Maximum storage in GB allowed for this organization'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

# OrganizationMember model handles all organization roles now