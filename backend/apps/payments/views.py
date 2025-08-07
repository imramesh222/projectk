from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q

from .models import Payment
from .serializers import PaymentSerializer
from apps.users.permissions import IsAdmin, IsOrganizationMember
from apps.organization.models import OrganizationMember, OrganizationRoleChoices

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        - Admins can perform all actions
        - Organization admins can view and manage payments for their organization
        - Finance team members can view and process payments
        - Regular users can only view their own payments
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            permission_classes = [
                IsAdmin | 
                IsOrganizationMember(roles=[
                    OrganizationRoleChoices.ADMIN,
                    OrganizationRoleChoices.FINANCE
                ])
            ]
        else:
            permission_classes = [
                IsAdmin | 
                IsOrganizationMember(roles=[
                    OrganizationRoleChoices.ADMIN,
                    OrganizationRoleChoices.FINANCE
                ])
            ]
            
        return [permission() if not callable(permission) else permission 
                for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter payments based on user role:
        - Admins see all payments
        - Organization admins see payments for their organization
        - Finance team members see all payments
        - Regular users see only their own payments
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        # If user is admin, return all payments
        if user.is_staff or user.is_superuser:
            return queryset
            
        try:
            # Get the user's organization membership
            member = OrganizationMember.objects.get(user=user)
            
            # If user is an admin or finance team member, return all payments for their organization
            if member.role in [OrganizationRoleChoices.ADMIN, OrganizationRoleChoices.FINANCE]:
                return queryset.filter(organization=member.organization)
                
            # For regular users, return only their own payments
            return queryset.filter(client__user=user)
                
        except OrganizationMember.DoesNotExist:
            # For users without an organization membership, return only their own payments
            return queryset.filter(client__user=user)
    
    def perform_create(self, serializer):
        """Set the organization and processed_by fields when creating a payment."""
        # Get the client making the payment
        client = serializer.validated_data.get('client')
        
        # Set the organization from the client's organization
        organization = client.organization if hasattr(client, 'organization') else None
        
        # Set the processed_by field to the current user if they are staff or admin
        processed_by = None
        if self.request.user.is_staff or self.request.user.is_superuser:
            try:
                processed_by = OrganizationMember.objects.get(user=self.request.user)
            except OrganizationMember.DoesNotExist:
                pass
        
        serializer.save(organization=organization, processed_by=processed_by)
