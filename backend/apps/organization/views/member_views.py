from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.organization.models import OrganizationMember, Organization
from apps.organization.serializers import (
    OrganizationMemberSerializer,
    OrganizationMemberCreateSerializer,
    OrganizationMemberUpdateSerializer
)
from apps.users.permissions import IsSuperAdmin, IsOrganizationAdmin

class OrganizationMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organization members.
    """
    queryset = OrganizationMember.objects.all()
    serializer_class = OrganizationMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by organization if specified in query params
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            return self.queryset.filter(organization_id=org_id)
        return self.queryset

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsSuperAdmin | IsOrganizationAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrganizationMemberCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrganizationMemberUpdateSerializer
        return OrganizationMemberSerializer

    def perform_create(self, serializer):
        organization_id = self.request.data.get('organization')
        organization = get_object_or_404(Organization, id=organization_id)
        serializer.save(organization=organization)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate an organization member."""
        member = self.get_object()
        member.is_active = False
        member.save()
        return Response({'status': 'member deactivated'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a deactivated organization member."""
        member = self.get_object()
        member.is_active = True
        member.save()
        return Response({'status': 'member activated'})
