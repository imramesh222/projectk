"""
Views for managing subscription plans, durations, and organization subscriptions.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .base_views import BaseOrganizationViewSet
from ..models import SubscriptionPlan, PlanDuration, OrganizationSubscription, Organization
from ..serializers import (
    SubscriptionPlanSerializer, 
    PlanDurationSerializer,
    OrganizationSubscriptionSerializer,
    OrganizationWithSubscriptionSerializer
)

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing subscription plans.
    Public read access, write access for admin users only.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]  # Allow public read access
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Public read access, write access for admin users only.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]  # Public read access
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Return all plans for superusers, active plans for others."""
        if self.request.user.is_superuser:
            return SubscriptionPlan.objects.all()
        return super().get_queryset().filter(is_active=True)
    
    @action(detail=True, methods=['get'])
    def durations(self, request, pk=None):
        """Get all durations for a specific plan."""
        plan = self.get_object()
        durations = plan.durations.filter(is_active=True)
        serializer = PlanDurationSerializer(durations, many=True)
        return Response(serializer.data)


class PlanDurationViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing plan durations."""
    queryset = PlanDuration.objects.filter(is_active=True)
    serializer_class = PlanDurationSerializer
    permission_classes = [permissions.AllowAny]  # Public read access
    pagination_class = None  # Disable pagination for plan durations

    def get_queryset(self):
        """Filter durations by plan if plan_id is provided."""
        queryset = super().get_queryset()
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id, is_active=True)
        return queryset.select_related('plan')  # Optimize queries with select_related


class OrganizationSubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing organization subscriptions.
    """
    serializer_class = OrganizationSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Superusers can see all subscriptions.
        Organization admins can see their organization's subscription.
        """
        user = self.request.user
        queryset = OrganizationSubscription.objects.select_related(
            'organization', 'plan_duration__plan'
        )
        
        if user.is_superuser:
            return queryset
            
        # For non-superusers, only show their organization's subscription
        if hasattr(user, 'organization') and user.organization:
            return queryset.filter(organization=user.organization)
            
        return OrganizationSubscription.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Create a new subscription."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Only superusers can create subscriptions
        if not request.user.is_superuser:
            return Response(
                {"detail": "You do not have permission to create subscriptions."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current organization's subscription."""
        user = request.user
        
        # For superusers, return 404 if no org_id is provided
        if user.is_superuser:
            org_id = request.query_params.get('org_id')
            if not org_id:
                return Response(
                    {"detail": "org_id parameter is required for superusers"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                org = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                return Response(
                    {"detail": "Organization not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # For regular users, get their organization
            org_member = user.organization_members.first()
            if not org_member:
                return Response(
                    {"detail": "You are not a member of any organization"},
                    status=status.HTTP_404_NOT_FOUND
                )
            org = org_member.organization
        
        try:
            subscription = OrganizationSubscription.objects.get(organization=org, is_active=True)
            serializer = self.get_serializer(subscription)
            return Response(serializer.data)
        except OrganizationSubscription.DoesNotExist:
            return Response(
                {"detail": "No active subscription found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription (set to not auto-renew)."""
        subscription = self.get_object()
        
        # Only superusers or organization admins can cancel
        if not (request.user.is_superuser or 
               subscription.organization.members.filter(
                   user=request.user, 
                   role='admin'
               ).exists()):
            return Response(
                {"detail": "You do not have permission to cancel this subscription."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        subscription.auto_renew = False
        subscription.save()
        return Response({"status": "subscription will not renew"})
