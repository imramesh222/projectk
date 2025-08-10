"""
Views for organization registration and self-service signup.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.utils import timezone
from django.conf import settings

from apps.organization.models import (
    Organization, 
    OrganizationMember, 
    OrganizationRoleChoices,
    SubscriptionPlan,
    PlanDuration,
    OrganizationSubscription
)
from apps.organization.serializers.registration_serializers import OrganizationRegistrationSerializer
from apps.users.models import User
from apps.users.tasks import send_welcome_email_task

class OrganizationRegistrationView(APIView):
    """
    API endpoint for self-service organization registration with subscription.
    """
    permission_classes = [AllowAny]
    
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """
        Register a new organization with subscription and admin user.
        """
        serializer = OrganizationRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        try:
            # 1. Create the organization
            org_data = {
                'name': data['organization_name'],
                'email': data['email'],
                'phone_number': data.get('phone_number', ''),
                'website': data.get('website', ''),
                'status': 'active',
                'is_active': True,
            }
            organization = Organization.objects.create(**org_data)
            
            # 2. Create the admin user
            user_data = {
                'email': data['email'],
                'username': data['username'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'is_active': True,
                'is_verified': False,
                'role': 'admin',  # Set role to admin for organization admin
            }
            user = User.objects.create_user(
                **user_data,
                password=data['password']
            )
            
            # 3. Add user as admin to the organization
            OrganizationMember.objects.create(
                user=user,
                organization=organization,
                role=OrganizationRoleChoices.ADMIN,
                is_active=True
            )
            
            # 4. Create subscription for the organization
            try:
                plan_duration = PlanDuration.objects.get(
                    id=data['plan_duration_id'],
                    is_active=True
                )
                
                today = timezone.now().date()
                end_date = today + timezone.timedelta(days=30 * plan_duration.duration_months)
                
                OrganizationSubscription.objects.create(
                    organization=organization,
                    plan_duration=plan_duration,
                    start_date=today,
                    end_date=end_date,
                    is_active=True,
                    auto_renew=data.get('auto_renew', True)
                )
            except PlanDuration.DoesNotExist:
                # If plan not found, organization will be on trial
                pass
            
            # Welcome email will be sent via post_save signal in users/signals.py
            
            return Response(
                {
                    'message': 'Organization and admin user created successfully',
                    'organization_id': str(organization.id),
                    'user_id': str(user.id)
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
