from rest_framework import serializers
from .models import Organization, AdminAssignment, Salesperson, Verifier, ProjectManager, Developer, Support
from apps.users.models import User
from apps.users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    """Basic organization serializer for list and create operations."""
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'description', 'logo', 'website', 'phone_number',
            'email', 'address', 'city', 'state', 'country', 'postal_code',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'slug']
        extra_kwargs = {
            'name': {'required': True},
            'email': {'required': True},
        }


class OrganizationDetailSerializer(OrganizationSerializer):
    """Detailed organization serializer with related fields."""
    admin_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta(OrganizationSerializer.Meta):
        fields = OrganizationSerializer.Meta.fields + ['admin_count', 'member_count']
    
    def get_admin_count(self, obj):
        return obj.admin_assignments.filter(is_active=True).count()
    
    def get_member_count(self, obj):
        return User.objects.filter(organization=obj).count()


class OrganizationCreateSerializer(OrganizationSerializer):
    """Serializer for organization creation with additional validation."""
    class Meta(OrganizationSerializer.Meta):
        fields = [f for f in OrganizationSerializer.Meta.fields if f not in ['id', 'created_at', 'updated_at']]


class AdminAssignmentSerializer(serializers.ModelSerializer):
    """Basic admin assignment serializer for list operations."""
    organization = serializers.StringRelatedField()
    admin = UserSerializer()
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)
    admin_email = serializers.EmailField(source='admin.email', read_only=True)

    class Meta:
        model = AdminAssignment
        fields = [
            'id', 'organization', 'admin', 'admin_name', 'admin_email',
            'is_active', 'created_at', 'updated_at', 'deactivated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deactivated_at']


class AdminAssignmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating admin assignments."""
    admin_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source='admin',
        write_only=True
    )
    
    class Meta:
        model = AdminAssignment
        fields = ['id', 'organization', 'admin_id', 'is_active']
        read_only_fields = ['id', 'is_active']
    
    def validate(self, data):
        """
        Check that the admin is not already assigned to this organization.
        """
        admin = data.get('admin')
        organization = data.get('organization')
        
        if AdminAssignment.objects.filter(
            admin=admin,
            organization=organization,
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                "This admin is already assigned to this organization."
            )
            
        return data


class AdminAssignmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating admin assignments."""
    class Meta:
        model = AdminAssignment
        fields = ['is_active']


class DeveloperSerializer(serializers.ModelSerializer):
    """
    Serializer for Developer model with user details.
    """
    id = serializers.UUIDField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Developer
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'organization', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
