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
    http_method_names = ['get']  # Explicitly allow GET requests
    
    def get(self, request, format=None):
        """
        Get dashboard data for super admin.
        """
        logger = logging.getLogger(__name__)
        
        try:
            # Log request details for debugging
            logger.info(f"=== DASHBOARD REQUEST START ===")
            logger.info(f"User: {request.user}")
            logger.info(f"Is authenticated: {request.user.is_authenticated}")
            logger.info(f"Is superuser: {request.user.is_superuser}")
            logger.info(f"Request headers: {dict(request.headers)}")
            
            if not request.user.is_authenticated:
                logger.error("User not authenticated for dashboard access")
                return Response(
                    {'detail': 'Authentication credentials were not provided.'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            if not request.user.is_superuser:
                logger.error(f"User {getattr(request.user, 'email', 'unknown')} is not authorized as superadmin")
                return Response(
                    {'detail': 'You do not have permission to access this resource.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get time period data
            logger.info("Getting time periods...")
            time_periods = self.get_time_periods()
            logger.info(f"Time periods: {time_periods}")
            
            # Get all users and organizations for metrics
            logger.info("Querying users and organizations...")
            users = User.objects.all()
            orgs = Organization.objects.all()
            
            # Log basic counts
            logger.info(f"Total users: {users.count()}")
            logger.info(f"Total organizations: {orgs.count()}")
            
            # Calculate metrics with detailed error handling
            try:
                logger.info("Counting active projects...")
                try:
                    active_projects = Project.objects.filter(is_verified=True).count()
                    logger.info(f"Found {active_projects} active projects")
                except Exception as e:
                    logger.error(f"Error counting active projects: {str(e)}", exc_info=True)
                    active_projects = 0
                
                logger.info("Calculating member growth...")
                try:
                    member_growth = users.filter(
                        date_joined__date__gte=time_periods['month_ago']
                    ).count()
                    logger.info(f"Found {member_growth} new members")
                except Exception as e:
                    logger.error(f"Error calculating member growth: {str(e)}", exc_info=True)
                    member_growth = 0
                
                logger.info("Calculating project completion rate...")
                try:
                    completion_rate = self._calculate_project_completion_rate()
                    logger.info(f"Project completion rate: {completion_rate}%")
                except Exception as e:
                    logger.error(f"Error calculating completion rate: {str(e)}", exc_info=True)
                    completion_rate = 0
                
                # Basic metrics that are less likely to fail
                try:
                    total_orgs = orgs.count()
                    total_users = users.count()
                    
                    metrics = {
                        'total_organizations': total_orgs,
                        'total_members': total_users,
                        'active_projects': active_projects,
                        'monthly_revenue': 0,  # This would come from payment data
                        'team_productivity': 75,  # Example value
                        'member_growth': member_growth,
                        'project_completion_rate': completion_rate
                    }
                    logger.info(f"Successfully calculated all metrics: {metrics}")
                    
                except Exception as e:
                    logger.error(f"Error assembling metrics dictionary: {str(e)}", exc_info=True)
                    raise
                
            except Exception as metrics_error:
                logger.error(f"Critical error in metrics calculation: {str(metrics_error)}", exc_info=True)
                return Response(
                    {
                        'error': 'Failed to calculate dashboard metrics',
                        'debug': str(metrics_error)
                    }, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Format member activity data
            member_activity = self._get_member_activity(time_periods)
            
            # Format project status data
            project_status = self._get_project_status()
            
            # Get recent activities
            recent_activities = self.get_recent_activities()
            
            response_data = {
                'metrics': {
                    'total_organizations': metrics['total_organizations'],
                    'total_members': metrics['total_members'],
                    'active_projects': metrics['active_projects'],
                    'monthly_revenue': metrics['monthly_revenue'],
                    'team_productivity': metrics['team_productivity'],
                    'member_growth': metrics['member_growth'],
                    'project_completion_rate': metrics['project_completion_rate']
                },
                'member_activity': member_activity,
                'project_status': project_status,
                'recent_activities': recent_activities,
                'timestamp': time_periods['now'].isoformat()
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(f"Error in SuperAdminDashboardView: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': 'An error occurred while fetching dashboard data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    def _calculate_project_completion_rate(self):
        """Calculate the percentage of completed projects."""
        total_projects = Project.objects.count()
        if total_projects == 0:
            return 0
            
        completed_projects = Project.objects.filter(status='completed').count()
        return round((completed_projects / total_projects) * 100, 1)
        
    def _get_member_activity(self, time_periods):
        """Get member activity data for the last 6 months."""
        six_months_ago = time_periods['now'] - timedelta(days=180)
        
        # Get new users per month for the last 6 months
        from django.db.models.functions import TruncMonth
        
        new_users = User.objects.filter(
            date_joined__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date_joined')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Format for the frontend
        member_activity = []
        for item in new_users:
            member_activity.append({
                'month': item['month'].strftime('%Y-%m'),
                'active': 0,  # This would require tracking active users
                'new': item['count']
            })
            
        return member_activity
        
    def _get_project_status(self):
        """Get project status breakdown."""
        from django.db.models import Count
        
        status_counts = Project.objects.values('status').annotate(
            count=Count('id')
        )
        
        status_map = {
            'not_started': { 'name': 'Not Started', 'color': '#9CA3AF' },
            'in_progress': { 'name': 'In Progress', 'color': '#3B82F6' },
            'on_hold': { 'name': 'On Hold', 'color': '#F59E0B' },
            'completed': { 'name': 'Completed', 'color': '#10B981' },
            'cancelled': { 'name': 'Cancelled', 'color': '#EF4444' }
        }
        
        project_status = []
        for item in status_counts:
            status_info = status_map.get(item['status'], { 'name': item['status'].title(), 'color': '#6B7280' })
            project_status.append({
                'name': status_info['name'],
                'value': item['count'],
                'color': status_info['color']
            })
            
        return project_status
    
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
        logger = logging.getLogger(__name__)
        
        try:
            # Recent user signups
            logger.info("Fetching recent user signups...")
            recent_signups = User.objects.order_by('-date_joined')[:5]
            logger.info(f"Found {len(recent_signups)} recent signups")
            
            for user in recent_signups:
                try:
                    user_info = {
                        'id': str(user.id) if hasattr(user, 'id') else 'unknown',
                        'email': getattr(user, 'email', 'no-email'),
                        'name': (user.get_full_name() if callable(getattr(user, 'get_full_name', None)) 
                                else getattr(user, 'username', 'unknown'))
                    }
                    
                    activities.append({
                        'type': 'user_signup',
                        'user': user_info,
                        'timestamp': getattr(user, 'date_joined', timezone.now()).isoformat(),
                        'message': f"New user registered: {user_info['email']}"
                    })
                except Exception as user_error:
                    logger.error(f"Error processing user {getattr(user, 'id', 'unknown')}: {str(user_error)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error in get_recent_activities: {str(e)}", exc_info=True)
            # Return a default activity if there's an error
            activities = [{
                'type': 'system',
                'timestamp': timezone.now().isoformat(),
                'message': 'Error loading recent activities'
            }]
        
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
        
        # Project statistics - filter projects through the client relationship
        projects = Project.objects.filter(client__organization=organization)
        project_stats = {
            'total': projects.count(),
            'active': projects.filter(status='in_progress').count(),
            'completed': projects.filter(status='completed').count(),
            'overdue': projects.filter(deadline__lt=time_periods['today'], status='in_progress').count()
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
        
        # Recent project updates - filter through client relationship
        recent_projects = Project.objects.filter(
            client__organization=organization
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
