from rest_framework import serializers
from apps.organization.models import OrganizationMember, OrganizationRoleChoices
from apps.users.serializers import UserSerializer

class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = [
            'id', 'user', 'user_details', 'organization', 'role', 'role_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """
        Override to include nested user details in the response.
        """
        representation = super().to_representation(instance)
        
        # Include user details at the top level for backward compatibility
        if 'user_details' in representation and representation['user_details']:
            user_data = representation.pop('user_details')
            representation['user'] = {
                'id': user_data['id'],
                'username': user_data['username'],
                'email': user_data['email'],
                'first_name': user_data.get('first_name', ''),
                'last_name': user_data.get('last_name', ''),
                'is_active': user_data.get('is_active', True)
            }
            
        return representation

class OrganizationMemberCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationMember
        fields = ['user', 'role', 'is_active']
        extra_kwargs = {
            'user': {'required': True},
            'role': {'required': True}
        }

    def validate_role(self, value):
        if value not in dict(OrganizationRoleChoices.choices):
            raise serializers.ValidationError("Invalid role")
        return value

class OrganizationMemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationMember
        fields = ['role', 'is_active']

    def validate_role(self, value):
        if value not in dict(OrganizationRoleChoices.choices):
            raise serializers.ValidationError("Invalid role")
        return value
