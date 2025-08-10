from rest_framework import permissions
from apps.organization.models import OrganizationMember, OrganizationRoleChoices


class BaseRolePermission(permissions.BasePermission):
    """Base permission class for role-based access control."""
    roles = []
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superadmins have all permissions
        if request.user.is_superuser or request.user.role == 'superadmin':
            return True
            
        # Check if user has any of the required roles in any organization
        if self.roles:
            return OrganizationMember.objects.filter(
                user=request.user,
                role__in=self.roles,
                is_active=True
            ).exists()
            
        return False


class IsSuperAdmin(permissions.BasePermission):
    """Allows access only to superadmin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_superuser or request.user.role == 'superadmin')
        )


class IsAdmin(BaseRolePermission):
    """Allows access only to admin users."""
    role = 'admin'


class IsOrganizationAdmin(permissions.BasePermission):
    """
    Allows access to:
    1. Global superadmins (user.is_superuser or user.role == 'superadmin')
    2. Organization admins (user has ADMIN role in any organization)
    """
    def has_permission(self, request, view):
        # Allow global superadmins
        if request.user and request.user.is_authenticated and \
           (request.user.is_superuser or request.user.role == 'superadmin'):
            return True
            
        # Check for organization admin role
        return bool(
            request.user and 
            request.user.is_authenticated and
            OrganizationMember.objects.filter(
                user=request.user,
                role=OrganizationRoleChoices.ADMIN,
                is_active=True
            ).exists()
        )


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Allows access to:
    1. The user themselves
    2. Superadmins (global or organization)
    3. Organization admins
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Allow access if the object is the user themselves
        if obj == request.user:
            return True
            
        # Allow access for superadmins
        if request.user.is_superuser or request.user.role == 'superadmin':
            return True
            
        # Check for organization admin role
        return OrganizationMember.objects.filter(
            user=request.user,
            role=OrganizationRoleChoices.ADMIN,
            is_active=True
        ).exists()


class IsSalesperson(BaseRolePermission):
    """Allows access only to users with the salesperson role in any organization."""
    roles = [OrganizationRoleChoices.SALESPERSON]


class IsVerifier(BaseRolePermission):
    """Allows access only to users with the verifier role in any organization."""
    roles = [OrganizationRoleChoices.VERIFIER]


class IsProjectManager(BaseRolePermission):
    """Allows access only to users with the project manager role in any organization."""
    roles = [OrganizationRoleChoices.PROJECT_MANAGER]


class IsDeveloper(BaseRolePermission):
    """Allows access only to users with the developer role in any organization."""
    roles = [OrganizationRoleChoices.DEVELOPER]


class IsSupport(BaseRolePermission):
    """Allows access only to users with the support role in any organization."""
    roles = [OrganizationRoleChoices.SUPPORT]


class IsOrganizationMember(permissions.BasePermission):
    """
    Allows access to users with specific roles in any organization.
    Can be initialized with a list of allowed roles.
    """
    def __init__(self, roles=None):
        self.roles = roles or []
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Superadmins have all permissions
        if request.user.is_superuser or request.user.role == 'superadmin':
            return True
            
        # If no specific roles are required, just check organization membership
        if not self.roles:
            return OrganizationMember.objects.filter(
                user=request.user,
                is_active=True
            ).exists()
            
        # Check for specific roles
        return OrganizationMember.objects.filter(
            user=request.user,
            role__in=self.roles,
            is_active=True
        ).exists()


class IsAdminOrSelf(permissions.BasePermission):
    """
    Allows access to admin users or the user themselves.
    Use for user profile access where users can view their own data.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and
            (request.user.role == 'admin' or 
             str(request.user.id) == view.kwargs.get('pk'))
        )


class HasOrganizationAccess(permissions.BasePermission):
    """
    Allows access only to users who have access to the organization
    in the view's kwargs or object.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Allow superadmins to access all organizations
        if request.user.role == 'superadmin':
            return True
            
        # Get organization_id from URL or data
        organization_id = (
            view.kwargs.get('organization_id') or
            request.data.get('organization') or
            (hasattr(view, 'get_object') and 
             getattr(view.get_object(), 'organization_id', None))
        )
        
        if not organization_id:
            return False
            
        # For admin users, check if they're assigned to this organization
        if hasattr(request.user, 'admin'):
            return str(request.user.admin.organization_id) == str(organization_id)
            
        # For other roles, check if they belong to the organization
        role_attr = getattr(request.user, request.user.role, None)
        if role_attr and hasattr(role_attr, 'organization_id'):
            return str(role_attr.organization_id) == str(organization_id)
            
        return False


class HasObjectPermission(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model has an 'organization' attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Superadmins can do anything
        if request.user.role == 'superadmin':
            return True
            
        # Admins can access objects in their organization
        if hasattr(request.user, 'admin'):
            return str(obj.organization_id) == str(request.user.admin.organization_id)
            
        # Other users can access objects in their organization
        role_attr = getattr(request.user, request.user.role, None)
        if role_attr and hasattr(role_attr, 'organization_id'):
            return str(obj.organization_id) == str(role_attr.organization_id)
            
        return False
