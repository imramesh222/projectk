from rest_framework import serializers
from .models import (
    Organization, AdminAssignment, Salesperson, Verifier, ProjectManager, 
    Developer, Support, SubscriptionPlan, PlanDuration, OrganizationSubscription
)
from apps.users.models import User
from apps.users.serializers import UserSerializer
from rest_framework import serializers
from datetime import date, timedelta
from django.utils import timezone

# Note: OrganizationCreateSerializer has been moved to serializers/organization.py


class OrganizationSerializer(serializers.ModelSerializer):
    """Basic organization serializer for list and create operations."""
    
    def __init__(self, *args, **kwargs):
        import logging
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing OrganizationSerializer")
        super().__init__(*args, **kwargs)
    
    def validate(self, data):
        self.logger.info(f"Validating organization data: {data}")
        return super().validate(data)
    
    def create(self, validated_data):
        self.logger.info(f"Creating organization with data: {validated_data}")
        try:
            instance = super().create(validated_data)
            self.logger.info(f"Successfully created organization: {instance.id}")
            return instance
        except Exception as e:
            self.logger.error(f"Error creating organization: {str(e)}")
            raise
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'description', 'logo', 'website', 'phone_number',
            'email', 'address', 'city', 'state', 'country', 'postal_code',
            'is_active', 'created_at', 'updated_at', 'max_users', 'max_storage',
            'status', 'legacy_plan'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'slug']
        extra_kwargs = {
            'name': {'required': True},
            'email': {
                'required': True,
                'allow_blank': False,
                'error_messages': {
                    'required': 'Email is required',
                    'blank': 'Email cannot be blank',
                    'invalid': 'Enter a valid email address'
                }
            },
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


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for SubscriptionPlan model."""
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlanDurationSerializer(serializers.ModelSerializer):
    """Serializer for PlanDuration model."""
    monthly_equivalent = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        read_only=True,
        help_text="Monthly equivalent price"
    )
    
    class Meta:
        model = PlanDuration
        fields = [
            'id', 'plan', 'duration_months', 'price', 'is_active', 
            'discount_percentage', 'monthly_equivalent', 'is_default'
        ]
        read_only_fields = ['id', 'monthly_equivalent']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['monthly_equivalent'] = round(instance.price / instance.duration_months, 2)
        return representation


class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for OrganizationSubscription model."""
    plan_name = serializers.CharField(source='plan_duration.plan.name', read_only=True)
    duration_months = serializers.IntegerField(source='plan_duration.duration_months', read_only=True)
    price = serializers.DecimalField(
        source='plan_duration.price', 
        max_digits=10, 
        decimal_places=2,
        read_only=True
    )
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = OrganizationSubscription
        fields = [
            'id', 'organization', 'plan_duration', 'plan_name', 'duration_months', 'price',
            'start_date', 'end_date', 'is_active', 'auto_renew', 'days_remaining',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'days_remaining', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate subscription data."""
        if 'start_date' not in data:
            data['start_date'] = timezone.now().date()
            
        if 'end_date' not in data and 'plan_duration' in data:
            duration = data['plan_duration'].duration_months
            data['end_date'] = data['start_date'] + timedelta(days=30 * duration)
            
        # Ensure end_date is after start_date
        if data.get('end_date') and data['end_date'] < data['start_date']:
            raise serializers.ValidationError({"end_date": "End date must be after start date"})
            
        return data


class OrganizationWithSubscriptionSerializer(OrganizationSerializer):
    """Organization serializer that includes subscription details."""
    subscription = OrganizationSubscriptionSerializer(read_only=True)
    
    class Meta(OrganizationSerializer.Meta):
        fields = OrganizationSerializer.Meta.fields + ['subscription']


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
