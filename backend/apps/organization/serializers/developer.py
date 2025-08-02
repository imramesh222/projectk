from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class DeveloperSerializer(serializers.ModelSerializer):
    """
    Serializer for developer information within an organization.
    Used primarily for task assignments and project associations.
    """
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email')
    
    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'profile_picture',
            'is_active',
            'date_joined'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() if obj.user else ''
