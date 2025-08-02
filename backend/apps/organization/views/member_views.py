from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.organization.models import OrganizationMember, Organization, OrganizationRoleChoices
from apps.organization.serializers import (
    OrganizationMemberSerializer,
    OrganizationMemberCreateSerializer,
    OrganizationMemberUpdateSerializer,
    DeveloperSerializer
)
from apps.users.permissions import IsSuperAdmin, IsOrganizationAdmin

class OrganizationMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organization members.
    """
    queryset = OrganizationMember.objects.select_related('user', 'organization').all()
    serializer_class = OrganizationMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['organization', 'role', 'is_active']
    search_fields = [
        'user__username', 'user__email', 
        'user__first_name', 'user__last_name',
        'organization__name'
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by organization if specified in query params
        organization_id = self.request.query_params.get('organization')
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
            
        # Filter by role if specified
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
            
        # Filter by search query
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(organization__name__icontains=search)
            )
            
        return queryset

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
        
    @action(detail=False, methods=['get'])
    def developers(self, request):
        """
        Get all developers across all organizations.
        """
        developers = self.get_queryset().filter(
            role=OrganizationRoleChoices.DEVELOPER,
            is_active=True
        )
        serializer = DeveloperSerializer(developers, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        organization_id = self.request.data.get('organization')
        organization = get_object_or_404(Organization, id=organization_id)
        
        # Check if user is already a member of this organization
        user_id = self.request.data.get('user')
        if OrganizationMember.objects.filter(
            user_id=user_id, 
            organization=organization
        ).exists():
            raise serializers.ValidationError({
                'user': 'This user is already a member of this organization.'
            })
            
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
