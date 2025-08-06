from rest_framework import permissions
from apps.organization.models import AdminAssignment


class BaseRolePermission(permissions.BasePermission):
    """Base permission class for role-based access control."""
    role = None
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == self.role
        )


class IsSuperAdmin(BaseRolePermission):
    """Allows access only to superadmin users."""
    role = 'superadmin'


class IsAdmin(BaseRolePermission):
    """Allows access only to admin users."""
    role = 'admin'


class IsOrganizationAdmin(permissions.BasePermission):
    """
    Allows access to:
    1. Global superadmins (user.role == 'superadmin')
    2. Organization admins (user has ADMIN role in any organization)
    """
    def has_permission(self, request, view):
        from apps.organization.models import OrganizationMember, OrganizationRoleChoices
        
        # Allow global superadmins
        if request.user and request.user.is_authenticated and request.user.role == 'superadmin':
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
    Allows access only to the user themselves or admin users.
    """
    def has_object_permission(self, request, view, obj):
        # Allow access if the user is an admin or the object is the user themselves
        is_admin = (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )
        is_self = request.user and request.user.is_authenticated and obj == request.user
        return is_admin or is_self


class IsSalesperson(BaseRolePermission):
    """Allows access only to salesperson users."""
    role = 'salesperson'


class IsVerifier(BaseRolePermission):
    """Allows access only to verifier users."""
    role = 'verifier'


class IsProjectManager(BaseRolePermission):
    """Allows access only to project manager users."""
    role = 'project_manager'


class IsDeveloper(BaseRolePermission):
    """Allows access only to developer users."""
    role = 'developer'


class IsSupport(BaseRolePermission):
    """Allows access only to support users."""
    role = 'support'


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
