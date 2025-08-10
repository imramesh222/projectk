"""
Serializers for organization registration and self-service signup.
"""
import uuid
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from apps.organization.models import PlanDuration
from apps.users.models import User

class OrganizationRegistrationSerializer(serializers.Serializer):
    """
    Serializer for organization registration with subscription.
    """
    # Organization fields
    organization_name = serializers.CharField(max_length=255, required=True)
    website = serializers.URLField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    # User fields
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    # Subscription fields
    plan_duration_id = serializers.UUIDField(required=False, allow_null=True)
    auto_renew = serializers.BooleanField(default=True)
    
    def validate_email(self, value):
        """
        Check if email is already in use by any user or organization.
        """
        from apps.organization.models import Organization
        
        value = value.lower()
        
        # Check if email exists in user accounts
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
            
        # Check if email is used by any organization
        if Organization.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use by an organization.")
            
        return value
    
    def validate_username(self, value):
        """Check if username is already in use."""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value.lower()
    
    def validate_password(self, value):
        """Validate password strength."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_plan_duration_id(self, value):
        """Validate that the plan duration exists and is active."""
        if value is None or value == '':
            raise serializers.ValidationError("Plan duration is required.")
            
        try:
            # Convert to integer
            plan_id = int(value)
            
            # Check if plan duration exists and is active
            try:
                duration = PlanDuration.objects.get(id=plan_id, is_active=True)
                return plan_id  # Return the integer ID
            except PlanDuration.DoesNotExist:
                raise serializers.ValidationError("Selected plan duration is not available.")
                
        except (ValueError, TypeError):
            raise serializers.ValidationError("Plan duration ID must be a valid number.")
    
    def validate(self, data):
        """Validate that passwords match."""
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data
    
    def create(self, validated_data):
        """
        This method is not used as we handle creation in the view.
        The actual creation is handled in OrganizationRegistrationView.
        """
        pass
