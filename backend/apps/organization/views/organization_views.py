from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.organization.models import Organization
from apps.organization.serializers import OrganizationSerializer, OrganizationDetailSerializer
from apps.organization.permissions import IsOrganizationAdmin

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizations.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsOrganizationAdmin]
    lookup_field = 'id'
    lookup_url_kwarg = 'org_id'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrganizationDetailSerializer
        return self.serializer_class

    def get_queryset(self):
        # Only show organizations the user is a member of
        if self.request.user.is_superuser:
            return self.queryset
        return self.queryset.filter(members__user=self.request.user, members__is_active=True).distinct()

    @action(detail=True, methods=['get'])
    def members(self, request, org_id=None):
        """
        List all members of an organization.
        """
        organization = self.get_object()
        members = organization.members.select_related('user').all()
        from apps.organization.serializers import OrganizationMemberSerializer
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def join(self, request, org_id=None):
        """
        Request to join an organization.
        """
        organization = self.get_object()
        user = request.user
        
        # Check if user is already a member
        if organization.members.filter(user=user).exists():
            return Response(
                {'detail': 'You are already a member of this organization.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create membership with default role
        from apps.organization.models import OrganizationMember, OrganizationRoleChoices
        OrganizationMember.objects.create(
            organization=organization,
            user=user,
            role=OrganizationRoleChoices.DEVELOPER,  # Default role
            is_active=False  # Requires admin approval
        )
        
        return Response(
            {'detail': 'Join request sent to organization admin.'},
            status=status.HTTP_201_CREATED
        )
