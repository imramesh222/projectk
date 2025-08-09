import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, Count, Q, F, Sum
from django.conf import settings
import psutil
import os
import platform
import socket
from datetime import datetime, timedelta
from django.db import connection

from .permissions import (
    IsSuperAdmin, IsOrganizationAdmin, IsProjectManager, 
    IsDeveloper, IsSalesperson, IsSupportStaff, IsVerifier
)
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
    permission_classes = [IsAuthenticated]
    
    def get_time_periods(self):
        now = timezone.now()
        return {
            'now': now,
            'today': now.date(),
            'yesterday': now.date() - timedelta(days=1),
            'week_ago': now.date() - timedelta(days=7),
            'month_ago': now.date() - timedelta(days=30)
        }

class ProjectManagerDashboardView(BaseDashboardView):
    """Dashboard view for project managers."""
    permission_classes = [IsProjectManager]
    
    def get(self, request, format=None):
        time_periods = self.get_time_periods()
        user = request.user
        
        # Get projects managed by this user
        managed_projects = Project.objects.filter(manager=user)
        
        # Project statistics
        project_stats = {
            'total': managed_projects.count(),
            'in_progress': managed_projects.filter(status='in_progress').count(),
            'on_hold': managed_projects.filter(status='on_hold').count(),
            'completed': managed_projects.filter(status='completed').count(),
            'overdue': managed_projects.filter(
                due_date__lt=time_periods['today'], 
                status__in=['in_progress', 'on_hold']
            ).count()
        }
        
        # Task statistics across all managed projects
        tasks = Task.objects.filter(project__in=managed_projects)
        task_stats = {
            'total': tasks.count(),
            'completed': tasks.filter(status='completed').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'not_started': tasks.filter(status='not_started').count(),
            'blocked': tasks.filter(status='blocked').count()
        }
        
        # Team workload
        team_workload = list(
            tasks.values('assigned_to__email')
                .annotate(
                    total_tasks=Count('id'),
                    completed_tasks=Count('id', filter=Q(status='completed')),
                    in_progress_tasks=Count('id', filter=Q(status='in_progress'))
                )
                .order_by('-in_progress_tasks')
        )
        
        # Upcoming deadlines (next 7 days)
        upcoming_deadlines = tasks.filter(
            due_date__range=[
                time_periods['today'],
                time_periods['today'] + timedelta(days=7)
            ]
        ).order_by('due_date')[:5]
        
        return Response({
            'project_stats': project_stats,
            'task_stats': task_stats,
            'team_workload': team_workload,
            'upcoming_deadlines': [{
                'id': str(task.id),
                'title': task.title,
                'due_date': task.due_date.isoformat(),
                'project': task.project.name,
                'status': task.status
            } for task in upcoming_deadlines],
            'timestamp': time_periods['now'].isoformat()
        })


class DeveloperDashboardView(BaseDashboardView):
    """Dashboard view for developers."""
    permission_classes = [IsDeveloper]
    
    def get(self, request, format=None):
        time_periods = self.get_time_periods()
        user = request.user
        
        # Get assigned tasks
        tasks = Task.objects.filter(assigned_to=user)
        
        # Task statistics
        task_stats = {
            'total': tasks.count(),
            'completed': tasks.filter(status='completed').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'not_started': tasks.filter(status='not_started').count(),
            'blocked': tasks.filter(status='blocked').count()
        }
        
        # Current tasks (in progress or not started)
        current_tasks = tasks.filter(
            status__in=['in_progress', 'not_started']
        ).order_by('due_date')
        
        # Recent activity
        recent_activity = tasks.order_by('-updated_at')[:5]
        
        return Response({
            'task_stats': task_stats,
            'current_tasks': [{
                'id': str(task.id),
                'title': task.title,
                'status': task.status,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'project': task.project.name
            } for task in current_tasks],
            'recent_activity': [{
                'id': str(task.id),
                'title': task.title,
                'status': task.status,
                'updated_at': task.updated_at.isoformat(),
                'project': task.project.name
            } for task in recent_activity],
            'timestamp': time_periods['now'].isoformat()
        })


class SalesDashboardView(BaseDashboardView):
    """Dashboard view for sales team."""
    permission_classes = [IsSalesperson]
    
    def get(self, request, format=None):
        time_periods = self.get_time_periods()
        user = request.user
        
        # Get clients managed by this salesperson
        clients = Client.objects.filter(sales_person=user)
        
        # Sales pipeline
        pipeline = {
            'leads': clients.filter(status='lead').count(),
            'contacted': clients.filter(status='contacted').count(),
            'proposal_sent': clients.filter(status='proposal_sent').count(),
            'negotiation': clients.filter(status='negotiation').count(),
            'closed_won': clients.filter(status='closed_won').count(),
            'closed_lost': clients.filter(status='closed_lost').count()
        }
        
        # Recent deals
        recent_deals = clients.order_by('-updated_at')[:5]
        
        # Revenue metrics (if payment module is enabled)
        revenue_metrics = {}
        if 'apps.payments' in settings.INSTALLED_APPS:
            revenue_metrics = {
                'monthly_revenue': Payment.objects.filter(
                    client__in=clients,
                    payment_date__month=time_periods['now'].month,
                    payment_date__year=time_periods['now'].year
                ).aggregate(total=Sum('amount'))['total'] or 0,
                'quarterly_revenue': Payment.objects.filter(
                    client__in=clients,
                    payment_date__quarter=(time_periods['now'].month-1)//3 + 1,
                    payment_date__year=time_periods['now'].year
                ).aggregate(total=Sum('amount'))['total'] or 0,
                'annual_revenue': Payment.objects.filter(
                    client__in=clients,
                    payment_date__year=time_periods['now'].year
                ).aggregate(total=Sum('amount'))['total'] or 0
            }
        
        return Response({
            'pipeline': pipeline,
            'recent_deals': [{
                'id': str(client.id),
                'name': client.name,
                'status': client.status,
                'value': client.estimated_value,
                'last_contact': client.last_contact_date.isoformat() if client.last_contact_date else None
            } for client in recent_deals],
            'revenue_metrics': revenue_metrics,
            'timestamp': time_periods['now'].isoformat()
        })


class SupportDashboardView(BaseDashboardView):
    """Dashboard view for support staff."""
    permission_classes = [IsSupportStaff]
    
    def get(self, request, format=None):
        time_periods = self.get_time_periods()
        user = request.user
        
        # Get tickets assigned to this support staff
        tickets = SupportTicket.objects.filter(assigned_to=user)
        
        # Ticket statistics
        ticket_stats = {
            'total': tickets.count(),
            'open': tickets.filter(status='open').count(),
            'in_progress': tickets.filter(status='in_progress').count(),
            'waiting': tickets.filter(status='waiting').count(),
            'resolved': tickets.filter(status='resolved').count(),
            'closed': tickets.filter(status='closed').count()
        }
        
        # Recent tickets
        recent_tickets = tickets.order_by('-created_at')[:5]
        
        # Average resolution time (in hours)
        resolved_tickets = tickets.filter(status__in=['resolved', 'closed'])
        avg_resolution = resolved_tickets.aggregate(
            avg_time=Avg(F('resolved_at') - F('created_at'))
        )['avg_time']
        
        if avg_resolution:
            avg_resolution_hours = avg_resolution.total_seconds() / 3600
        else:
            avg_resolution_hours = 0
        
        return Response({
            'ticket_stats': ticket_stats,
            'recent_tickets': [{
                'id': str(ticket.id),
                'subject': ticket.subject,
                'status': ticket.status,
                'priority': ticket.priority,
                'created_at': ticket.created_at.isoformat(),
                'client': ticket.client.name if ticket.client else None
            } for ticket in recent_tickets],
            'performance_metrics': {
                'avg_resolution_time_hours': round(avg_resolution_hours, 2),
                'tickets_resolved_this_week': resolved_tickets.filter(
                    resolved_at__gte=time_periods['week_ago']
                ).count()
            },
            'timestamp': time_periods['now'].isoformat()
        })


class VerifierDashboardView(BaseDashboardView):
    """Dashboard view for verifiers."""
    permission_classes = [IsVerifier]
    
    def get(self, request, format=None):
        time_periods = self.get_time_periods()
        user = request.user
        
        # Get items pending verification
        # Note: Adjust these queries based on what needs verification in your system
        pending_verification = {
            'documents': [],  # Example: Document.objects.filter(status='pending_verification')
            'users': User.objects.filter(
                is_verified=False,
                date_joined__gte=time_periods['today'] - timedelta(days=7)
            ).count(),
            'other_items': 0  # Add other items that need verification
        }
        
        # Verification statistics
        verification_stats = {
            'pending': sum(pending_verification.values()),
            'processed_today': 0,  # Adjust based on your models
            'processed_this_week': 0,  # Adjust based on your models
            'rejection_rate': 0.15  # Example value, calculate based on your data
        }
        
        return Response({
            'pending_verification': pending_verification,
            'verification_stats': verification_stats,
            'recent_activity': [],  # Add recent verification activities
            'timestamp': time_periods['now'].isoformat()
        })


# Common views for all users
class UserProfileView(BaseDashboardView):
    """View for user profile information."""
    def get(self, request, format=None):
        user = request.user
        return Response({
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'organization': {
                'id': str(user.organization.id),
                'name': user.organization.name
            } if hasattr(user, 'organization') and user.organization else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'date_joined': user.date_joined.isoformat()
        })


class SystemHealthView(APIView):
    """View for system health monitoring."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, format=None):
        """Get system health metrics."""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_used_gb = round(memory.used / (1024 ** 3), 2)
            memory_total_gb = round(memory.total / (1024 ** 3), 2)
            memory_percent = memory.percent
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_used_gb = round(disk.used / (1024 ** 3), 2)
            disk_total_gb = round(disk.total / (1024 ** 3), 2)
            disk_percent = disk.percent
            
            # System info
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = str(datetime.now() - boot_time).split('.')[0]  # Remove microseconds
            
            # Database status
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    db_status = 'connected'
                    db_tables = len(connection.introspection.table_names())
            except Exception as e:
                db_status = f'error: {str(e)}'
                db_tables = 0
            
            # Service status (example services - customize as needed)
            services = [
                self._check_service('Django', ['python', 'manage.py']),
                self._check_service('PostgreSQL', ['postgres']),
                self._check_service('Redis', ['redis-server']),
                self._check_service('Celery', ['celery']),
            ]
            
            return Response({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'system': {
                    'os': f"{platform.system()} {platform.release()}",
                    'hostname': socket.gethostname(),
                    'python_version': platform.python_version(),
                },
                'cpu': {
                    'usage_percent': cpu_percent,
                    'cores': cpu_count,
                },
                'memory': {
                    'used_gb': memory_used_gb,
                    'total_gb': memory_total_gb,
                    'usage_percent': memory_percent,
                },
                'disk': {
                    'used_gb': disk_used_gb,
                    'total_gb': disk_total_gb,
                    'usage_percent': disk_percent,
                },
                'uptime': uptime,
                'database': {
                    'status': db_status,
                    'tables': db_tables,
                },
                'services': services,
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch system metrics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _check_service(self, name, process_names):
        """Check if a service is running by process name."""
        try:
            for proc in psutil.process_iter(['name', 'cmdline']):
                try:
                    if any(name.lower() in ' '.join(proc.info['cmdline'] or []).lower() 
                          for name in process_names):
                        return {
                            'name': name,
                            'status': 'running',
                            'pid': proc.pid,
                            'memory_mb': round(proc.memory_info().rss / (1024 * 1024), 2)
                        }
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            return {'name': name, 'status': 'stopped'}
        except Exception as e:
            return {'name': name, 'status': f'error: {str(e)}'}


class UserNotificationsView(APIView):
    """View for user notifications."""
    
    def get(self, request, format=None):
        """Get user notifications."""
        # TODO: Implement actual notification fetching
        return Response({
            'unread_count': 0,
            'notifications': []
        })


class GlobalSearchView(BaseDashboardView):
    """Global search across the platform."""
    def get(self, request, format=None):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': []})
        
        results = []
        user = request.user
        
        # Search in projects (adjust based on user permissions)
        projects = Project.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        
        for project in projects[:5]:  # Limit to 5 results per type
            results.append({
                'type': 'project',
                'id': str(project.id),
                'name': project.name,
                'description': project.description[:100] + '...' if project.description else '',
                'url': f'/projects/{project.id}'
            })
        
        # Add more search types (tasks, clients, etc.) as needed
        
        return Response({'results': results})
        # Calculate time periods
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        
        # User statistics
        total_users = User.objects.count()
        active_users_today = User.objects.filter(
            last_login__date=today
        ).count()
        
        new_users_this_week = User.objects.filter(
            date_joined__date__gte=week_ago
        ).count()
        
        # Organization statistics
        total_organizations = Organization.objects.count()
        active_organizations = Organization.objects.filter(
            is_active=True
        ).count()
        
        # System statistics
        system_health = self.get_system_health()
        
        # Recent activity (last 10 activities)
        recent_activities = self.get_recent_activities()
        
        # Compile the response
        data = {
            'user_stats': {
                'total': total_users,
                'active_today': active_users_today,
                'new_this_week': new_users_this_week,
            },
            'organization_stats': {
                'total': total_organizations,
                'active': active_organizations,
            },
            'system': system_health,
            'recent_activities': recent_activities,
            'last_updated': now.isoformat()
        }
        
        return Response(data, status=status.HTTP_200_OK)
    
    def get_system_health(self):
        """Get system health metrics."""
        # This is a placeholder - you might want to add more sophisticated checks
        return {
            'status': 'healthy',
            'database': 'online',
            'storage': {
                'used_percent': 45,  # This should be calculated based on actual storage
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
        # This is a simplified version - you might want to use Django's logging system
        # or a dedicated activity tracking app for production
        activities = []
        
        # Get recent user signups
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
        
        # Sort all activities by timestamp and return the most recent
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return activities[:limit]
