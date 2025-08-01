from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

# Import models
from .models import Project

# Import serializers
from .serializers import ProjectSerializer

# Import organization models
from apps.organization.models import Salesperson, Verifier, ProjectManager
from apps.users.permissions import IsAdmin, IsSalesperson, IsProjectManager, IsVerifier

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
            permission_classes = [IsVerifier]
        elif self.action in ['create']:
            permission_classes = [IsAdmin | IsSalesperson]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAdmin | IsProjectManager]
        else:
            permission_classes = [permissions.IsAuthenticated]
            
        return [permission() for permission in permission_classes]
    
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
        project.verifier = get_object_or_404(Verifier, user=request.user)
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)
