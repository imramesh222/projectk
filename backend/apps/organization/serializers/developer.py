from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import OrganizationMember, OrganizationRoleChoices

User = get_user_model()

class DeveloperSerializer(serializers.ModelSerializer):
    """
    Serializer for developer information within an organization.
    Used primarily for task assignments and project associations.
    """
    id = serializers.UUIDField(source='user.id')
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email')
    profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active')
    date_joined = serializers.DateTimeField(source='user.date_joined')
    
    class Meta:
        model = OrganizationMember
        fields = [
            'id',
            'full_name',
            'email',
            'profile_picture',
            'is_active',
            'date_joined',
            'role'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() if obj.user else ''
    
    def to_representation(self, instance):
        # Only include developers in the output
        if instance.role != OrganizationRoleChoices.DEVELOPER:
            return None
        return super().to_representation(instance)
