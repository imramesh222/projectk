from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q, Sum, F
from django.conf import settings
import logging

from .permissions import IsSuperAdmin, IsOrganizationAdmin

from apps.users.models import User
from apps.organization.models import Organization, OrganizationMember
from apps.projects.models import Project
from apps.projects.tasks import Task

from apps.clients.models import Client
from apps.support.models import SupportTicket
from apps.payments.models import Payment

logger = logging.getLogger(__name__)

class BaseDashboardView(APIView):
    """Base view for all dashboard views with common functionality."""
    permission_classes = []
    
    def get_time_periods(self):
        now = timezone.now()
        return {
            'now': now,
            'today': now.date(),
            'yesterday': now.date() - timedelta(days=1),
            'week_ago': now.date() - timedelta(days=7),
            'month_ago': now.date() - timedelta(days=30),
            'start_of_week': now.date() - timedelta(days=now.weekday()),
            'start_of_month': now.replace(day=1).date()
        }
    
    def get_organization_context(self, user):
        """Get organization context for the user."""
        if user.is_superuser:
            return {
                'organizations': Organization.objects.all(),
                'current_organization': None
            }
        
        # For organization users, get their organizations
        memberships = OrganizationMember.objects.filter(user=user).select_related('organization')
        return {
            'organizations': [m.organization for m in memberships],
            'current_organization': memberships.first().organization if memberships.exists() else None
        }
    
    def get_common_context(self, request):
        """Get common context for all dashboard views."""
        context = {
            'user': request.user,
            'time_periods': self.get_time_periods(),
            'now': timezone.now()
        }
        context.update(self.get_organization_context(request.user))
        return context


class SuperAdminDashboardView(BaseDashboardView):
    """Dashboard view for super admin users."""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request, format=None):
        context = self.get_common_context(request)
        time_periods = context['time_periods']
        
        # User statistics
        users = User.objects.all()
        user_stats = {
            'total': users.count(),
            'active_today': users.filter(last_login__date=time_periods['today']).count(),
            'new_this_week': users.filter(date_joined__date__gte=time_periods['week_ago']).count(),
            'by_role': list(users.values('role').annotate(count=Count('id')))
        }
        
        # Organization statistics
        orgs = Organization.objects.all()
        org_stats = {
            'total': orgs.count(),
            'active': orgs.filter(is_active=True).count(),
            'new_this_month': orgs.filter(created_at__date__gte=time_periods['month_ago']).count()
        }
        
        # System health
        system_health = self.get_system_health()
        
        # Recent activities
        recent_activities = self.get_recent_activities()
        
        return Response({
            'user_stats': user_stats,
            'organization_stats': org_stats,
            'system_health': system_health,
            'recent_activities': recent_activities,
            'timestamp': time_periods['now'].isoformat()
        })
    
    def get_system_health(self):
        """Get system health metrics."""
        # TODO: Implement actual system health checks
        return {
            'status': 'healthy',
            'database': 'online',
            'storage': {
                'used_percent': 45,
                'status': 'ok'
            },
            'services': {
                'database': True,
                'cache': True,
                'background_worker': True
            }
        }
    
    def get_recent_activities(self, limit=10):
        """Get recent system activities."""
        activities = []
        
        # Recent user signups
        recent_signups = User.objects.order_by('-date_joined')[:5]
        for user in recent_signups:
            activities.append({
                'type': 'user_signup',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'name': user.get_full_name() or user.username
                },
                'timestamp': user.date_joined.isoformat(),
                'message': f"New user registered: {user.email}"
            })
        
        # Sort by timestamp and return limited results
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return activities[:limit]


class OrganizationAdminDashboardView(BaseDashboardView):
    """Dashboard view for organization administrators."""
    permission_classes = [IsOrganizationAdmin]
    
    def get(self, request, format=None):
        context = self.get_common_context(request)
        organization = context.get('current_organization')
        
        if not organization:
            return Response(
                {'error': 'User is not a member of any organization'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        time_periods = context['time_periods']
        
        # Member statistics
        members = OrganizationMember.objects.filter(organization=organization)
        member_stats = {
            'total': members.count(),
            'by_role': list(members.values('role').annotate(count=Count('id')))
        }
        
        # Project statistics
        projects = Project.objects.filter(organization=organization)
        project_stats = {
            'total': projects.count(),
            'active': projects.filter(status='in_progress').count(),
            'completed': projects.filter(status='completed').count(),
            'overdue': projects.filter(due_date__lt=time_periods['today'], status='in_progress').count()
        }
        
        # Recent activities
        recent_activities = self.get_recent_activities(organization)
        
        return Response({
            'organization': {
                'id': str(organization.id),
                'name': organization.name,
                'created_at': organization.created_at.isoformat()
            },
            'member_stats': member_stats,
            'project_stats': project_stats,
            'recent_activities': recent_activities,
            'timestamp': time_periods['now'].isoformat()
        })
    
    def get_recent_activities(self, organization, limit=10):
        """Get recent activities for the organization."""
        activities = []
        
        # Recent project updates
        recent_projects = Project.objects.filter(
            organization=organization
        ).order_by('-updated_at')[:5]
        
        for project in recent_projects:
            activities.append({
                'type': 'project_update',
                'project': {
                    'id': str(project.id),
                    'name': project.name,
                    'status': project.status
                },
                'timestamp': project.updated_at.isoformat(),
                'message': f"Project '{project.name}' was updated"
            })
        
        # Sort by timestamp and return limited results
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return activities[:limit]
