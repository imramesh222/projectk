from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from .models import ActivityLog, ActivityType
from .serializers import ActivityLogSerializer
from apps.users.permissions import IsSuperAdmin

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows activity logs to be viewed.
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    
    def get_queryset(self):
        # Only show logs from the last 30 days by default
        queryset = ActivityLog.objects.all().select_related('user')
        
        # Filter by user if specified
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        # Filter by activity type if specified
        activity_type = self.request.query_params.get('activity_type')
        if activity_type in dict(ActivityType.choices):
            queryset = queryset.filter(activity_type=activity_type)
            
        # Search in details if search parameter is provided
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(details__icontains=search) |
                Q(object_type__icontains=search) |
                Q(ip_address__icontains=search)
            )
            
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent activities for the dashboard.
        """
        limit = min(int(request.query_params.get('limit', 20)), 100)
        queryset = self.get_queryset()[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics for activities.
        """
        from django.db.models import Count, F, Value
        from django.db.models.functions import TruncDay, TruncHour
        
        # Activity counts by type
        by_type = ActivityLog.objects.values('activity_type').annotate(
            count=Count('activity_type'),
            label=F('activity_type')
        )
        
        # Activities per day for the last 7 days
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        daily_activity = (
            ActivityLog.objects
            .filter(created_at__date__gte=start_date.date())
            .annotate(date=TruncDay('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        return Response({
            'by_type': list(by_type),
            'daily_activity': list(daily_activity),
            'total_activities': ActivityLog.objects.count(),
            'unique_users': ActivityLog.objects.values('user').distinct().count()
        })
