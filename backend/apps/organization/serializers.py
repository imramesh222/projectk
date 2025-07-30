from rest_framework import serializers
from .models import Organization, AdminAssignment
from apps.users.models import User

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class AdminAssignmentSerializer(serializers.ModelSerializer):
    organization = serializers.StringRelatedField()
    admin = serializers.StringRelatedField()

    class Meta:
        model = AdminAssignment
        fields = ['id', 'organization', 'admin', 'created_at']
