from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.organization.models import Organization, OrganizationMember
from apps.users.serializers import UserSerializer

User = get_user_model()

class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for Organization model (basic fields)
    """
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'description', 'website', 'logo',
            'is_active', 'created_at', 'updated_at', 'phone_number',
            'email', 'address', 'city', 'state'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class OrganizationDetailSerializer(OrganizationSerializer):
    """
    Extended serializer for Organization with additional details
    """
    member_count = serializers.SerializerMethodField()
    admin_count = serializers.SerializerMethodField()
    
    class Meta(OrganizationSerializer.Meta):
        fields = OrganizationSerializer.Meta.fields + [
            'member_count', 'admin_count'
        ]
    
    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()
    
    def get_admin_count(self, obj):
        from apps.organization.models import OrganizationRoleChoices
        return obj.members.filter(
            role=OrganizationRoleChoices.ADMIN,
            is_active=True
        ).count()

class OrganizationCreateSerializer(OrganizationSerializer):
    """
    Serializer for creating a new organization
    """
    class Meta(OrganizationSerializer.Meta):
        fields = ['name', 'description', 'website', 'logo', 'phone_number', 'email', 'address', 'city', 'state']
    
    def create(self, validated_data):
        # Create the organization
        organization = super().create(validated_data)
        
        # Add the creator as an admin
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            from apps.organization.models import OrganizationRoleChoices
            
            OrganizationMember.objects.create(
                organization=organization,
                user=request.user,
                role=OrganizationRoleChoices.ADMIN,
                is_active=True
            )
        
        return organization
