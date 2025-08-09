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

class SubscriptionPlan(models.Model):
    """
    Defines different subscription plans (Basic, Pro, Enterprise)
    All plans have the same features, only duration and pricing vary
    """
    name = models.CharField(max_length=100)  # e.g., "Basic", "Pro", "Enterprise"
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class PlanDuration(models.Model):
    """
    Defines different duration options for each plan
    """
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='durations')
    duration_months = models.PositiveIntegerField(help_text="Duration in months (e.g., 1, 3, 6, 12)")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is the default duration shown for the plan"
    )

    class Meta:
        ordering = ['duration_months']
        unique_together = ['plan', 'duration_months']

    def __str__(self):
        return f"{self.plan.name} - {self.duration_months} months"


class OrganizationSubscription(models.Model):
    """
    Tracks an organization's subscription to a plan
    """
    organization = models.OneToOneField(
        'Organization',
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan_duration = models.ForeignKey(
        PlanDuration,
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calculate end_date if not provided
        if self.start_date and not self.end_date and self.plan_duration:
            from datetime import timedelta
            from django.utils import timezone
            
            if not self.start_date:
                self.start_date = timezone.now().date()
                
            self.end_date = self.start_date + timedelta(days=30 * self.plan_duration.duration_months)
        
        super().save(*args, **kwargs)

    @property
    def days_remaining(self):
        from django.utils import timezone
        return (self.end_date - timezone.now().date()).days if self.end_date else 0

    def __str__(self):
        return f"{self.organization.name} - {self.plan_duration.plan.name} (Until {self.end_date})"

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
    # Legacy plan field (for migration purposes)
    legacy_plan = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Legacy plan field for migration. Use subscription relation instead."
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