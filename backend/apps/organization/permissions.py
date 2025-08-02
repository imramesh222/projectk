from rest_framework import permissions
from .models import OrganizationRoleChoices
from .utils import has_organization_permission

class IsOrganizationMember(permissions.BasePermission):
    """
    Allows access only to users who are members of the organization.
    """
    def has_permission(self, request, view):
        organization = view.get_organization()
        if not organization:
            return False
            
        # Superadmins have all permissions
        if request.user.is_superuser:
            return True
            
        return has_organization_permission(
            request.user,
            organization,
            OrganizationRoleChoices.DEVELOPER  # Most permissive role
        )

class IsOrganizationAdmin(permissions.BasePermission):
    """
    Allows access only to organization admins.
    """
    def has_permission(self, request, view):
        organization = view.get_organization()
        if not organization:
            return False
            
        return has_organization_permission(
            request.user,
            organization,
            OrganizationRoleChoices.ADMIN
        )

class IsOrganizationAdminOrReadOnly(IsOrganizationAdmin):
    """
    Allows read access to all users, but write access only to organization admins.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return super().has_permission(request, view)

def has_org_role_permission(required_role):
    """
    Factory function to create permission classes that check for specific roles.
    """
    class HasOrgRolePermission(permissions.BasePermission):
        def has_permission(self, request, view):
            organization = view.get_organization()
            if not organization:
                return False
                
            return has_organization_permission(
                request.user,
                organization,
                required_role
            )
    
    return HasOrgRolePermission
