from rest_framework import serializers
from .models import ActivityLog, ActivityType
from apps.users.serializers import UserSerializer

class ActivityLogSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    activity_type_display = serializers.CharField(source='get_activity_type_display')
    
    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'user',
            'user_details',
            'activity_type',
            'activity_type_display',
            'object_type',
            'object_id',
            'details',
            'ip_address',
            'created_at',
            'user_agent'
        ]
        read_only_fields = fields
    
    def get_user_details(self, obj):
        if not obj.user:
            return None
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'full_name': f"{obj.user.first_name} {obj.user.last_name}".strip() or None
        }
