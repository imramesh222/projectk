from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

# Import models
from .models import Project

# Import serializers
from .serializers import ProjectSerializer

# Import organization models
from apps.organization.models import OrganizationMember, OrganizationRoleChoices
from apps.users.permissions import IsAdmin, IsOrganizationMember

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects.
    - Salespersons can create and view their own projects
    - Project managers can view and update projects they're assigned to
    - Admins can perform all actions
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'verify':
            # Only verifiers can verify projects
            permission_classes = [IsOrganizationMember(roles=[OrganizationRoleChoices.VERIFIER])]
        elif self.action in ['create']:
            # Only admins and salespersons can create projects
            permission_classes = [
                IsAdmin | 
                IsOrganizationMember(roles=[OrganizationRoleChoices.SALESPERSON])
            ]
        elif self.action in ['update', 'partial_update']:
            # Only admins and project managers can update projects
            permission_classes = [
                IsAdmin | 
                IsOrganizationMember(roles=[OrganizationRoleChoices.PROJECT_MANAGER])
            ]
        else:
            # Any authenticated user can view projects (filtering happens in get_queryset)
            permission_classes = [permissions.IsAuthenticated]
            
        return [permission() if not callable(permission) else permission 
                for permission in permission_classes]
    
    def get_queryset(self):
        """
        Return projects based on user's role:
        - Admins see all projects
        - Organization members see projects based on their role
        """
        user = self.request.user
        queryset = Project.objects.all()
        
        # If user is admin, return all projects
        if user.is_staff or user.is_superuser:
            return queryset
            
        # Get organization member record if exists
        try:
            member = OrganizationMember.objects.get(user=user)
        except OrganizationMember.DoesNotExist:
            return queryset.none()
            
        # Filter based on role
        if member.role == OrganizationRoleChoices.SALESPERSON:
            return queryset.filter(salesperson=member)
        elif member.role == OrganizationRoleChoices.PROJECT_MANAGER:
            return queryset.filter(project_manager=member)
        elif member.role == OrganizationRoleChoices.VERIFIER:
            return queryset.filter(verifier=member)
            
        return queryset.none()
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verify a project (for verifiers)
        """
        project = self.get_object()
        project.is_verified = True
        project.verifier = get_object_or_404(OrganizationMember, user=request.user, role=OrganizationRoleChoices.VERIFIER)
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)
