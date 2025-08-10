"""
Serializers for user registration with organization and subscription.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from apps.organization.models import Organization, PlanDuration
from apps.users.models import User
from .user_serializers import UserSerializer

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with optional organization and subscription.
    """
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    # Organization fields (optional)
    organization_name = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True,
        help_text="Required for organization signup"
    )
    plan_duration_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Required for organization signup with paid plan"
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'confirm_password', 'organization_name',
            'plan_duration_id'
        ]
        extra_kwargs = {
            'username': {'required': False},  # Will be auto-generated if not provided
            'password': {'write_only': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        """Check if email is already in use."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
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
        """Validate that the plan duration exists and is active if provided."""
        if value and not PlanDuration.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Selected plan duration is not available.")
        return value
    
    def validate(self, data):
        """Validate that passwords match and organization fields are consistent."""
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        # If organization_name is provided, plan_duration_id is optional but recommended
        organization_name = data.get('organization_name')
        plan_duration_id = data.get('plan_duration_id')
        
        if organization_name and not plan_duration_id:
            # If organization is provided but no plan, we'll create a trial organization
            data['is_trial'] = True
        
        return data
    
    def create(self, validated_data):
        """
        Create a new user and optionally create an organization and subscription.
        """
        from django.db import transaction
        from apps.organization.models import (
            Organization, 
            OrganizationMember, 
            OrganizationRoleChoices,
            OrganizationSubscription
        )
        
        organization_name = validated_data.pop('organization_name', None)
        plan_duration_id = validated_data.pop('plan_duration_id', None)
        is_trial = validated_data.pop('is_trial', False)
        
        with transaction.atomic():
            # 1. Create the user
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                password=validated_data['password'],
                is_active=True,
                role='user'  # Default role for new users
            )
            
            # 2. If organization_name is provided, create organization and subscription
            if organization_name:
                # Create organization
                organization = Organization.objects.create(
                    name=organization_name,
                    email=user.email,
                    status='active' if not is_trial else 'trial',
                    is_active=True
                )
                
                # Add user as admin to the organization
                OrganizationMember.objects.create(
                    user=user,
                    organization=organization,
                    role=OrganizationRoleChoices.ADMIN,
                    is_active=True
                )
                
                # Create subscription if plan_duration_id is provided
                if plan_duration_id:
                    try:
                        plan_duration = PlanDuration.objects.get(
                            id=plan_duration_id,
                            is_active=True
                        )
                        
                        from django.utils import timezone
                        today = timezone.now().date()
                        end_date = today + timezone.timedelta(
                            days=30 * plan_duration.duration_months
                        )
                        
                        OrganizationSubscription.objects.create(
                            organization=organization,
                            plan_duration=plan_duration,
                            start_date=today,
                            end_date=end_date,
                            is_active=True,
                            auto_renew=True
                        )
                    except PlanDuration.DoesNotExist:
                        # If plan not found, continue without subscription
                        pass
            
            return user
