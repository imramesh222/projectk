import uuid
from django.shortcuts import get_object_or_404
from django.apps import apps

# Lazy import to avoid circular imports
def get_organization_member_model():
    return apps.get_model('organization', 'OrganizationMember')

def get_organization_role_choices():
    # Import here to avoid circular import
    from .models import OrganizationRoleChoices
    return OrganizationRoleChoices

def get_user_organization_role(user, organization):
    """
    Get a user's role in a specific organization
    
    Args:
        user: The user object
        organization: The organization object or ID
        
    Returns:
        str: The user's role in the organization, or None if not a member
    """
    if not user or not user.is_authenticated:
        return None
        
    # If user is superadmin, they implicitly have all roles
    if user.is_superuser:
        return get_organization_role_choices().ADMIN
        
    try:
        OrganizationMember = get_organization_member_model()
        if isinstance(organization, (str, uuid.UUID)):
            member = OrganizationMember.objects.get(
                user=user,
                organization_id=organization,
                is_active=True
            )
        else:
            member = OrganizationMember.objects.get(
                user=user,
                organization=organization,
                is_active=True
            )
        return member.role
    except OrganizationMember.DoesNotExist:
        return None

def has_organization_permission(user, organization, required_role):
    """
    Check if a user has at least the required role in an organization
    
    Args:
        user: The user object
        organization: The organization object or ID
        required_role: The minimum required role (from OrganizationRoleChoices)
        
    Returns:
        bool: True if user has the required role or higher, False otherwise
    """
    if not user or not user.is_authenticated:
        return False
        
    # Superadmins have all permissions
    if user.is_superuser:
        return True
        
    # Get the user's role in the organization
    user_role = get_user_organization_role(user, organization)
    if not user_role:
        return False
        
    # Get role choices
    role_choices = get_organization_role_choices()
    
    # Check if user's role is at least the required role
    role_hierarchy = [
        role_choices.ADMIN,
        role_choices.PROJECT_MANAGER,
        role_choices.VERIFIER,
        role_choices.SUPPORT,
        role_choices.DEVELOPER,
        role_choices.SALESPERSON
    ]
    
    try:
        required_level = role_hierarchy.index(required_role)
        user_level = role_hierarchy.index(user_role)
        return user_level <= required_level
    except ValueError:
        return False

def get_organization_members(organization, role=None, is_active=True):
    """
    Get members of an organization, optionally filtered by role and active status
    
    Args:
        organization: The organization object or ID
        role: Optional role to filter by
        is_active: Filter by active status (default: True)
        
    Returns:
        QuerySet: Filtered OrganizationMember queryset
    """
    filters = {
        'organization': organization,
        'is_active': is_active
    }
    
    if role:
        filters['role'] = role
        
    OrganizationMember = get_organization_member_model()
    return OrganizationMember.objects.filter(**filters).select_related('user')
