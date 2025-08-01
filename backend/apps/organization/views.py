from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings

from apps.users.permissions import (
    IsAuthenticated, IsSuperAdmin, IsAdmin, HasOrganizationAccess
)
from .models import Organization, AdminAssignment, Salesperson, Verifier, ProjectManager, Developer, Support
from .serializers import (
    OrganizationSerializer, OrganizationDetailSerializer, OrganizationCreateSerializer,
    AdminAssignmentSerializer, AdminAssignmentCreateSerializer, AdminAssignmentUpdateSerializer
)
from apps.users.models import User
from apps.notifications.utils import send_notification_to_admin


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizations.
    - Superadmins can see and manage all organizations
    - Admins can see and manage their own organization
    - Other users can only list organizations (filtered by their access)
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsSuperAdmin | IsAdmin]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action == 'retrieve':
            return OrganizationDetailSerializer
        if self.action == 'create':
            return OrganizationCreateSerializer
        return OrganizationSerializer

    def get_queryset(self):
        """
        Filter organizations based on the requesting user's role.
        """
        user = self.request.user
        queryset = Organization.objects.all()

        # Superadmins can see all organizations
        if user.role == 'superadmin':
            return queryset

        # Admins can see their own organization
        if hasattr(user, 'admin'):
            return queryset.filter(id=user.admin.organization_id)

        # For other roles, check if they belong to an organization
        role_attrs = ['salesperson', 'verifier', 'projectmanager', 'developer', 'support']
        for attr in role_attrs:
            if hasattr(user, attr):
                return queryset.filter(id=getattr(user, attr).organization_id)

        return Organization.objects.none()

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """
        Get all members of an organization.
        """
        organization = self.get_object()
        members = {
            'admins': [admin.user for admin in organization.admins.all()],
            'salespeople': [sp.user for sp in organization.salespeople.all()],
            'verifiers': [v.user for v in organization.verifiers.all()],
            'project_managers': [pm.user for pm in organization.project_managers.all()],
            'developers': [dev.user for dev in organization.developers.all()],
            'support_staff': [s.user for s in organization.support_staff.all()],
        }
        return Response(members)


class AdminAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing admin assignments.
    - Superadmins can create/update/delete any admin assignment
    - Organization admins can only view assignments in their organization
    """
    queryset = AdminAssignment.objects.all()
    serializer_class = AdminAssignmentSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return AdminAssignmentCreateSerializer
        return AdminAssignmentSerializer

    def get_queryset(self):
        """
        Filter admin assignments based on the requesting user's role.
        """
        user = self.request.user
        queryset = AdminAssignment.objects.all()

        # Superadmins can see all admin assignments
        if user.role == 'superadmin':
            return queryset

        # Admins can see assignments in their organization
        if hasattr(user, 'admin'):
            return queryset.filter(organization=user.admin.organization)

        return AdminAssignment.objects.none()

    def perform_create(self, serializer):
        """
        Handle admin assignment creation with notifications.
        """
        admin_user = serializer.validated_data['admin']
        org = serializer.validated_data['organization']
        
        # Save the assignment
        assignment = serializer.save()
        
        # Send email notification
        send_mail(
            subject=f'You have been assigned as an admin of {org.name}',
            message=(
                f'Hello {admin_user.username},\n\n'
                f'You have been assigned as an administrator of {org.name}.\n'
                'Please log in to the admin dashboard to manage your organization.\n\n'
                'Best regards,\nThe ProjectK Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_user.email],
            fail_silently=True,
        )

        # Send real-time notification
        send_notification_to_admin(
            user=admin_user,
            message=f"You have been assigned as an admin of {org.name}",
            notification_type='admin_assignment',
            related_object_id=assignment.id
        )

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Deactivate an admin assignment.
        """
        assignment = self.get_object()
        assignment.is_active = False
        assignment.save()
        return Response({'status': 'admin assignment deactivated'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """
        Reactivate a deactivated admin assignment.
        """
        assignment = self.get_object()
        assignment.is_active = True
        assignment.save()
        return Response({'status': 'admin assignment reactivated'}, status=status.HTTP_200_OK)
