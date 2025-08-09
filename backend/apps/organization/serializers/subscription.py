"""Serializers for subscription-related models."""
from rest_framework import serializers
from ..models import SubscriptionPlan, PlanDuration, OrganizationSubscription


class PlanDurationSerializer(serializers.ModelSerializer):
    """Serializer for PlanDuration model."""
    class Meta:
        model = PlanDuration
        fields = [
            'id', 'duration_months', 'price', 'is_active', 
            'discount_percentage', 'is_default'
        ]
        read_only_fields = ['id']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for SubscriptionPlan model with nested durations."""
    durations = PlanDurationSerializer(many=True, read_only=True)
    
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'description', 'is_active', 'durations']
        read_only_fields = ['id']


class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for OrganizationSubscription model."""
    plan_name = serializers.CharField(source='plan_duration.plan.name', read_only=True)
    duration_months = serializers.IntegerField(
        source='plan_duration.duration_months', 
        read_only=True
    )
    price = serializers.DecimalField(
        source='plan_duration.price', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = OrganizationSubscription
        fields = [
            'id', 'plan_duration', 'plan_name', 'duration_months', 'price',
            'start_date', 'end_date', 'is_active', 'auto_renew',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'start_date', 'end_date']
    
    def validate_plan_duration(self, value):
        """Validate that the plan duration is active."""
        if not value.is_active:
            raise serializers.ValidationError("Selected plan duration is not active.")
        return value
    
    def create(self, validated_data):
        """Create a new subscription with proper start and end dates."""
        from django.utils import timezone
        
        plan_duration = validated_data['plan_duration']
        validated_data['start_date'] = timezone.now().date()
        
        # Calculate end date based on duration
        from datetime import timedelta
        validated_data['end_date'] = (
            validated_data['start_date'] + 
            timedelta(days=30 * plan_duration.duration_months)
        )
        
        return super().create(validated_data)
