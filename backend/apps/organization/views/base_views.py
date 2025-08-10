"""
Base views and utilities for organization-related views.
"""
from rest_framework import viewsets, permissions
from rest_framework.response import Response

class BaseOrganizationViewSet(viewsets.GenericViewSet):
    """Base viewset for organization-related views.
    
    Provides common functionality and permissions for all organization-related views.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return an empty queryset by default.
        
        This method can be overridden by child classes to provide custom querysets.
        By default, it returns an empty queryset.
        """
        return self.queryset.model.objects.none()
    
    def get_serializer_context(self):
        """Add the request to the serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Save the serializer with the current user as the creator."""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Save the serializer with the current user as the updater."""
        serializer.save(updated_by=self.request.user)


class OrganizationAdminPermission(permissions.BasePermission):
    """Permission class that allows access only to organization admins."""
    
    def has_permission(self, request, view):
        """Check if user has permission to access the view.
        
        Returns:
            bool: True if user is superuser or organization admin, False otherwise
        """
        # Superusers have all permissions
        if request.user.is_superuser:
            return True
            
        # Check if the user is an admin of any organization
        return request.user.organization_members.filter(
            role='admin',
            is_active=True
        ).exists()


class OrganizationMemberPermission(permissions.BasePermission):
    """Permission class that allows access to organization members."""
    
    def has_permission(self, request, view):
        """Check if user has permission to access the view.
        
        Returns:
            bool: True if user is superuser or organization member, False otherwise
        """
        # Superusers have all permissions
        if request.user.is_superuser:
            return True
            
        # Check if the user is a member of any organization
        return request.user.organization_members.filter(
            is_active=True
        ).exists()
