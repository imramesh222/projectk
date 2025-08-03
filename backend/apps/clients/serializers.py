from rest_framework import serializers
from .models import Client
from apps.organization.models import Organization
from apps.users.serializers import UserSerializer


class ClientSerializer(serializers.ModelSerializer):
    """Basic client serializer for list and create operations."""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    salesperson_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'address', 
            'city', 'state', 'country', 'postal_code', 'status', 'source',
            'created_at', 'updated_at', 'organization', 'salesperson',
            'organization_name', 'salesperson_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'organization_name', 'salesperson_name']
        ref_name = 'clients.Client'  # Unique ref_name to avoid conflicts
        extra_kwargs = {
            'name': {'required': True},
            'email': {'required': True},
            'organization': {'required': True},
        }
    
    def get_salesperson_name(self, obj):
        return str(obj.salesperson) if obj.salesperson else None


class ClientDetailSerializer(ClientSerializer):
    """Detailed client serializer with related fields."""
    organization_detail = serializers.SerializerMethodField()
    salesperson_detail = serializers.SerializerMethodField()
    total_projects = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    
    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + [
            'organization_detail', 'salesperson_detail',
            'total_projects', 'total_value', 'notes'
        ]
    
    def get_organization_detail(self, obj):
        from apps.organization.serializers import OrganizationSerializer
        return OrganizationSerializer(obj.organization).data
    
    def get_salesperson_detail(self, obj):
        if not obj.salesperson:
            return None
        return UserSerializer(obj.salesperson).data
    
    def get_total_projects(self, obj):
        # This will need to be updated once the Project model is properly set up
        return 0
    
    def get_total_value(self, obj):
        # This will need to be updated once the Project model is properly set up
        return 0


class ClientCreateSerializer(ClientSerializer):
    """Serializer for client creation with additional validation."""
    class Meta(ClientSerializer.Meta):
        fields = [f for f in ClientSerializer.Meta.fields 
                 if f not in ['id', 'created_at', 'updated_at', 'organization_name', 'salesperson_name']]
    
    def validate(self, data):
        """
        Additional validation for client creation.
        - Ensure the organization is active
        - If salesperson is provided, ensure they belong to the same organization
        """
        organization = data.get('organization')
        salesperson = data.get('salesperson')
        
        if not organization.is_active:
            raise serializers.ValidationError({
                'organization': 'Cannot assign to an inactive organization.'
            })
            
        if salesperson and salesperson.organization != organization:
            raise serializers.ValidationError({
                'salesperson': 'The salesperson must belong to the same organization.'
            })
            
        return data


class ClientUpdateSerializer(ClientSerializer):
    """Serializer for updating clients with role-based field validation."""
    class Meta(ClientSerializer.Meta):
        read_only_fields = ClientSerializer.Meta.read_only_fields + ['organization']
    
    def validate(self, data):
        """
        Additional validation for client updates.
        - If salesperson is provided, ensure they belong to the same organization
        """
        salesperson = data.get('salesperson')
        organization = data.get('organization', getattr(self.instance, 'organization', None))
        
        if salesperson and organization and salesperson.organization != organization:
            raise serializers.ValidationError({
                'salesperson': 'The salesperson must belong to the same organization.'
            })
            
        return data
