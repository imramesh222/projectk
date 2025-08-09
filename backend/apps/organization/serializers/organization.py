from rest_framework import serializers
from django.contrib.auth import get_user_model

from apps.organization.models import Organization, OrganizationMember, OrganizationSubscription
from apps.users.serializers import UserSerializer
from .subscription import OrganizationSubscriptionSerializer

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
            'email', 'address', 'city', 'state', 'country', 'postal_code',
            'status', 'max_users', 'max_storage', 'legacy_plan'
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

class OrganizationWithSubscriptionSerializer(OrganizationSerializer):
    """
    Extended serializer for Organization with subscription details
    """
    subscription = serializers.SerializerMethodField()
    
    class Meta(OrganizationSerializer.Meta):
        fields = OrganizationSerializer.Meta.fields + ['subscription']
    
    def get_subscription(self, obj):
        """Get the active subscription for the organization."""
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=obj,
                is_active=True
            )
            return OrganizationSubscriptionSerializer(subscription).data
        except OrganizationSubscription.DoesNotExist:
            return None


class OrganizationCreateSerializer(OrganizationSerializer):
    """
    Serializer for creating a new organization
    """
    class Meta(OrganizationSerializer.Meta):
        fields = [
            'name', 'description', 'website', 'logo', 'phone_number', 
            'email', 'address', 'city', 'state', 'country', 'postal_code',
            'status', 'plan', 'max_users', 'max_storage'
        ]
        extra_kwargs = {
            'max_users': {'required': True},
            'max_storage': {'required': True},
            'status': {'required': True},
            'plan': {'required': True}
        }
    
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
