from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

from apps.users.permissions import IsSuperAdmin
from ..models import Organization, OrganizationMember

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
        active_projects = 0  # Replace with actual query when Project model is available
        
        # Calculate monthly revenue (example, adjust based on your billing model)
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
        project_status = [
            {'name': 'Completed', 'count': 45},
            {'name': 'In Progress', 'count': 30},
            {'name': 'Planning', 'count': 15},
            {'name': 'On Hold', 'count': 10},
        ]
        
        # Get recent activities (example, adjust based on your Activity model)
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
