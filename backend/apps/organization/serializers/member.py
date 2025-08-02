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
