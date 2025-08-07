from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models

from .models import SupportTicket
from .serializers import SupportTicketSerializer
from apps.users.permissions import IsAdmin, IsOrganizationMember
from apps.organization.models import OrganizationRoleChoices
from apps.clients.models import Client

class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        - Admins and support staff can perform all actions
        - Other authenticated users can only view and create tickets
        """
        if self.action in ['create', 'list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [
                IsAdmin | 
                IsOrganizationMember(roles=[OrganizationRoleChoices.SUPPORT])
            ]
            
        return [permission() if not callable(permission) else permission 
                for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter tickets based on user role:
        - Admins see all tickets
        - Support staff see tickets assigned to them or unassigned
        - Regular users see only their own tickets
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        # If user is admin, return all tickets
        if user.is_staff or user.is_superuser:
            return queryset
            
        try:
            # Get the user's organization membership
            member = OrganizationMember.objects.get(user=user)
            
            # If user is support staff, return their assigned tickets and unassigned tickets
            if member.role == OrganizationRoleChoices.SUPPORT:
                return queryset.filter(
                    models.Q(support=member) | 
                    models.Q(support__isnull=True)
                )
                
        except OrganizationMember.DoesNotExist:
            pass
            
        # For regular users, return only their own tickets
        return queryset.filter(client__user=user)
    
    def perform_create(self, serializer):
        """Set the client to the current user's client profile."""
        # Get or create a client profile for the current user
        client, _ = Client.objects.get_or_create(user=self.request.user)
        serializer.save(client=client)