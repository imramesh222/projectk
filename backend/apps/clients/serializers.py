from rest_framework import serializers
from .models import Client
from apps.organization.models import Organization
from apps.users.serializers import UserProfileSerializer


class ClientSerializer(serializers.ModelSerializer):
    """Basic client serializer for list and create operations."""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'address', 
            'city', 'state', 'country', 'postal_code', 'status', 'source',
            'created_at', 'updated_at', 'organization', 'assigned_to',
            'organization_name', 'assigned_to_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'organization_name', 'assigned_to_name']
        extra_kwargs = {
            'name': {'required': True},
            'email': {'required': True},
            'organization': {'required': True},
        }
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class ClientDetailSerializer(ClientSerializer):
    """Detailed client serializer with related fields."""
    organization_detail = serializers.SerializerMethodField()
    assigned_to_detail = serializers.SerializerMethodField()
    total_projects = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    
    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + [
            'organization_detail', 'assigned_to_detail',
            'total_projects', 'total_value', 'notes'
        ]
    
    def get_organization_detail(self, obj):
        from apps.organization.serializers import OrganizationSerializer
        return OrganizationSerializer(obj.organization).data
    
    def get_assigned_to_detail(self, obj):
        if not obj.assigned_to:
            return None
        return {
            'id': obj.assigned_to.id,
            'name': obj.assigned_to.get_full_name(),
            'email': obj.assigned_to.email,
            'role': obj.assigned_to.get_role_display()
        }
    
    def get_total_projects(self, obj):
        # This assumes there's a related_name='projects' on the Project model
        return obj.projects.count() if hasattr(obj, 'projects') else 0
    
    def get_total_value(self, obj):
        # This assumes there's a related_name='projects' on the Project model
        if not hasattr(obj, 'projects'):
            return 0
        return sum(project.value for project in obj.projects.all() if project.value)


class ClientCreateSerializer(ClientSerializer):
    """Serializer for client creation with additional validation."""
    class Meta(ClientSerializer.Meta):
        fields = [f for f in ClientSerializer.Meta.fields 
                 if f not in ['id', 'created_at', 'updated_at', 'organization_name', 'assigned_to_name']]
    
    def validate(self, data):
        """
        Additional validation for client creation.
        - Ensure the organization is active
        - If assigned_to is provided, ensure they belong to the same organization
        """
        organization = data.get('organization')
        assigned_to = data.get('assigned_to')
        
        if not organization.is_active:
            raise serializers.ValidationError({
                'organization': 'Cannot assign to an inactive organization.'
            })
            
        if assigned_to and assigned_to.organization != organization:
            raise serializers.ValidationError({
                'assigned_to': 'The assigned user must belong to the same organization.'
            })
            
        return data


class ClientUpdateSerializer(ClientSerializer):
    """Serializer for updating clients with role-based field validation."""
    class Meta(ClientSerializer.Meta):
        read_only_fields = ClientSerializer.Meta.read_only_fields + ['organization']
