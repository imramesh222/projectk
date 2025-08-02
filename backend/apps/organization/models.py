import uuid
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from apps.users.models import User

class OrganizationRoleChoices(models.TextChoices):
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
        default=OrganizationRoleChoices.DEVELOPER
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'organization')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()}) at {self.organization.name}"

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
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

# Deprecated - Will be removed after migration to OrganizationMember
class AdminAssignment(models.Model):
    """
    Deprecated - Will be removed after migration to OrganizationMember
    Tracks admin assignments to organizations
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='admin_assignments')
    admin = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_assignments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.admin.username} -> {self.organization.name}"
        
    class Meta:
        ordering = ['-created_at']

# Deprecated - Will be removed after migration to OrganizationMember
class Salesperson(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='salesperson_role')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='salespersons')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} at {self.organization.name}"

# Deprecated - Will be removed after migration to OrganizationMember
class Verifier(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verifier_role')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='verifiers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} at {self.organization.name}"

class ProjectManager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='project_manager_role')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='project_managers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username

class Developer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='developer_role')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='developers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username

class Support(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='support_role')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='support_staff')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username