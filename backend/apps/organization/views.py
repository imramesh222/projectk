from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Count, Sum, F
from django.db.models.functions import TruncMonth, ExtractMonth, ExtractYear
from django.utils import timezone
from datetime import timedelta, datetime
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from apps.users.permissions import IsSuperAdmin, IsAdmin, HasOrganizationAccess
from .models import Organization, AdminAssignment, Salesperson, Verifier, ProjectManager, Developer, Support, OrganizationMember
from .serializers import (
    OrganizationSerializer, OrganizationDetailSerializer, OrganizationCreateSerializer,
    AdminAssignmentSerializer, AdminAssignmentCreateSerializer, AdminAssignmentUpdateSerializer,
    DashboardMetricsSerializer
)

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_organization_view(request, org_id=None):
    """
    Debug endpoint to test organization URL routing.
    """
    return Response({
        'message': 'Debug endpoint reached',
        'org_id': str(org_id) if org_id else None,
        'method': request.method,
        'path': request.path,
        'query_params': dict(request.query_params)
    }, status=status.HTTP_200_OK)


class DashboardViewSet(APIView):
    """
    API endpoint that returns dashboard metrics for the SuperAdmin.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        # Get the current date and time
        now = timezone.now()
        one_year_ago = now - timedelta(days=365)
        
        # Get total organizations count
        total_organizations = Organization.objects.count()
        
        # Get total members count across all organizations
        total_members = OrganizationMember.objects.count()
        
        # Get active projects count (example, adjust based on your Project model)
        # active_projects = Project.objects.filter(status='active').count()
        active_projects = 0  # Replace with actual query when Project model is available
        
        # Calculate monthly revenue (example, adjust based on your billing model)
        # monthly_revenue = Invoice.objects.filter(
        #     created_at__month=now.month,
        #     created_at__year=now.year,
        #     status='paid'
        # ).aggregate(total=Sum('amount'))['total'] or 0
        monthly_revenue = 0  # Replace with actual query when billing is implemented
        
        # Calculate team productivity (example metric)
        # This is a placeholder - adjust based on your actual metrics
        team_productivity = 94  # Example value
        
        # Calculate member growth over the last 6 months
        six_months_ago = now - timedelta(days=180)
        monthly_member_growth = []
        
        for i in range(6):
            month = now - timedelta(days=30 * (5 - i))
            month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            count = OrganizationMember.objects.filter(
                created_at__range=(month_start, month_end)
            ).count()
            
            monthly_member_growth.append({
                'month': month.strftime('%b'),
                'new': count,
                'active': OrganizationMember.objects.filter(
                    created_at__lte=month_end
                ).count()
            })
        
        # Get project status distribution (example, adjust based on your Project model)
        # project_status = Project.objects.values('status').annotate(count=Count('id'))
        project_status = [
            {'name': 'Completed', 'count': 45},
            {'name': 'In Progress', 'count': 30},
            {'name': 'Planning', 'count': 15},
            {'name': 'On Hold', 'count': 10},
        ]
        
        # Get recent activities (example, adjust based on your Activity model)
        # recent_activities = Activity.objects.order_by('-created_at')[:5].values('id', 'action', 'user__name', 'created_at')
        recent_activities = [
            {'id': 1, 'action': 'New member joined', 'user': 'Sarah Wilson', 'time': '5 minutes ago', 'type': 'member'},
            {'id': 2, 'action': 'Project milestone completed', 'user': 'Mobile App v2.0', 'time': '1 hour ago', 'type': 'project'},
            {'id': 3, 'action': 'Invoice generated', 'user': '$12,500', 'time': '2 hours ago', 'type': 'billing'},
            {'id': 4, 'action': 'Team meeting scheduled', 'user': 'Weekly Standup', 'time': '3 hours ago', 'type': 'meeting'},
            {'id': 5, 'action': 'New project created', 'user': 'E-commerce Platform', 'time': '5 hours ago', 'type': 'project'},
        ]
        
        # Prepare the response data
        data = {
            'metrics': {
                'total_organizations': total_organizations,
                'total_members': total_members,
                'active_projects': active_projects,
                'monthly_revenue': monthly_revenue,
                'team_productivity': team_productivity,
                'member_growth': 12.5,  # Example growth percentage
                'project_completion_rate': 75  # Example completion rate
            },
            'member_activity': monthly_member_growth,
            'project_status': project_status,
            'recent_activities': recent_activities
        }
        
        return Response(data)


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
        # Handle Swagger schema generation
        user = self.request.user
        queryset = Organization.objects.all()

        # Superadmins can see all organizations
        if user.is_superuser:
            return queryset

        # Organization admins can see their own organization
        if hasattr(user, 'admin_organization'):
            return Organization.objects.filter(pk=user.admin_organization.organization.pk)
            
        # Regular users can only see organizations they're a member of
        return Organization.objects.filter(
            Q(admin_assignments__admin=user, admin_assignments__is_active=True) |
            Q(developers__user=user) |
            Q(project_managers__user=user) |
            Q(salespersons__user=user) |
            Q(support_staff__user=user) |
            Q(verifiers__user=user)
        ).distinct()

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single organization by ID.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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
        # Handle Swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return AdminAssignment.objects.none()
            
        user = self.request.user
        
        # Handle unauthenticated users
        if not user.is_authenticated:
            return AdminAssignment.objects.none()
            
        queryset = AdminAssignment.objects.all()

        # Superadmins can see all admin assignments
        if hasattr(user, 'role') and user.role == 'superadmin':
            return queryset

        # Admins can see assignments in their organization
        if hasattr(user, 'admin') and hasattr(user.admin, 'organization'):
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
