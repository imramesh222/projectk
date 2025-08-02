from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from apps.organization.models import (
    Organization, 
    OrganizationMember,
    OrganizationRoleChoices
)
from apps.organization.serializers import (
    OrganizationSerializer, 
    OrganizationDetailSerializer,
    OrganizationMemberSerializer,
    OrganizationMemberCreateSerializer
)
from apps.organization.permissions import IsOrganizationAdmin
from apps.users.permissions import IsSuperAdmin

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizations.
    """
    queryset = Organization.objects.annotate(
        member_count=Count('members', filter=Q(members__is_active=True))
    ).all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'org_id'
    filterset_fields = ['is_active']
    search_fields = ['name', 'description', 'industry']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrganizationDetailSerializer
        elif self.action == 'add_member':
            return OrganizationMemberCreateSerializer
        return self.serializer_class

    def get_organization(self):
        """Get the organization from the URL parameter."""
        org_id = self.kwargs.get('org_id')
        if org_id:
            return get_object_or_404(Organization, id=org_id)
        return None

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Only show organizations the user is a member of, unless superuser
        if not self.request.user.is_superuser:
            queryset = queryset.filter(
                members__user=self.request.user, 
                members__is_active=True
            ).distinct()
            
        # Apply search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(industry__icontains=search)
            )
            
        return queryset

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'add_member']:
            permission_classes = [IsSuperAdmin | IsOrganizationAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['get'])
    def members(self, request, org_id=None):
        """
        List all members of an organization with their roles.
        """
        organization = self.get_object()
        members = organization.members.select_related('user').all()
        
        # Filter by role if specified
        role = request.query_params.get('role')
        if role:
            members = members.filter(role=role)
            
        # Filter by search query
        search = request.query_params.get('search')
        if search:
            members = members.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )
            
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'])
    def add_member(self, request, org_id=None):
        """
        Add a member to the organization with a specific role.
        """
        organization = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if user is already a member
        user_id = serializer.validated_data['user'].id
        if OrganizationMember.objects.filter(
            user_id=user_id,
            organization=organization
        ).exists():
            return Response(
                {'detail': 'User is already a member of this organization.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Create the organization membership
        serializer.save(organization=organization)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def join(self, request, org_id=None):
        """
        Request to join an organization.
        Handles both string and UUID org_id formats.
        """
        from apps.organization.models import Organization
        from uuid import UUID
        
        # Convert org_id to UUID if it's a string
        if org_id and isinstance(org_id, str):
            try:
                org_id = UUID(org_id)
            except (ValueError, TypeError):
                return Response(
                    {'detail': 'Invalid organization ID format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get the organization directly instead of using get_object()
        try:
            organization = Organization.objects.get(id=org_id)
        except (Organization.DoesNotExist, ValueError):
            return Response(
                {'detail': 'Organization not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        user = request.user
        
        # Check if user is already a member
        if OrganizationMember.objects.filter(
            user=user,
            organization=organization
        ).exists():
            return Response(
                {'detail': 'You are already a member of this organization.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Create organization membership with default USER role
        member = OrganizationMember.objects.create(
            user=user,
            organization=organization,
            role=OrganizationRoleChoices.USER,
            is_active=True
        )
        
        serializer = OrganizationMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
