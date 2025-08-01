from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

from .serializers import UserSerializer
from apps.organization.models import Organization, AdminAssignment
from .permissions import (
    IsSuperAdmin, 
    IsOrganizationAdmin, 
    IsSelfOrAdmin,
    IsAdminOrSelf  # Add missing import
)
from .utils.email_utils import send_welcome_email

# Get the User model
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register_user(request):
    """
    Register a new user.
    All new users get 'user' role by default.
    Only superadmins can assign other roles during registration.
    """
    data = request.data.copy()
    email_sent = False
    email_status = 'disabled'
    
    try:
        # Handle both camelCase and snake_case field names for first/last name
        if 'firstName' in data and 'first_name' not in data:
            data['first_name'] = data.pop('firstName', '')
        if 'lastName' in data and 'last_name' not in data:
            data['last_name'] = data.pop('lastName', '')
        
        # Default role is 'user' for new registrations
        # Only superadmins can specify a different role during user creation
        if 'role' in data:
            if not (request.user.is_authenticated and request.user.role == 'superadmin'):
                # Non-superadmin trying to set role - remove it
                data.pop('role', None)
        
        # If role is not set or was removed, default to 'user'
        if 'role' not in data:
            data['role'] = 'user'
        
        # Set default values for required fields if not provided
        data.setdefault('is_active', True)
        data.setdefault('date_joined', timezone.now())
        
        # Password validation is now handled in the serializer
        serializer = UserSerializer(data=data)
        
        if not serializer.is_valid():
            # Format validation errors for better client-side handling
            errors = {}
            for field, messages in serializer.errors.items():
                errors[field] = {
                    'code': 'invalid',
                    'message': ' '.join(str(msg) for msg in messages)
                }
            return Response(
                {'detail': 'Validation failed', 'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the user within a transaction
        user = serializer.save()
        
        # Set password separately to handle hashing
        if 'password' in data:
            user.set_password(data['password'])
            user.save(update_fields=['password'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Send welcome email in the background if email is enabled
        if getattr(settings, 'EMAIL_ENABLED', False) and user.email:
            try:
                from .tasks import send_welcome_email_task
                send_welcome_email_task.delay(user.id)
                email_sent = True
                email_status = 'scheduled'
            except Exception as e:
                # Log the error but don't fail the registration
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to schedule welcome email: {str(e)}", exc_info=True)
                email_sent = False
                email_status = 'failed'
        
        # Prepare response data
        response_data = {
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'expires_in': int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            },
            'status': 'success',
            'message': 'Registration successful. Welcome to our platform!',
            'account': {
                'status': 'active' if user.is_active else 'pending_activation',
                'email_verification_required': not user.is_active,
                'welcome_email_sent': email_sent,
                'email_status': email_status
            },
            'next_steps': [
                'Check your email for a welcome message' if email_sent else 'Enable email to receive notifications',
                'Complete your profile settings',
                'Explore the dashboard'
            ]
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        # Handle unexpected errors
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        
        return Response(
            {
                'detail': 'An unexpected error occurred during registration.',
                'error': str(e)
            },
            status=status.HTTP_201_CREATED
        )
    
    return Response(
        {'error': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST
    )


class UserRegisterView(APIView):
    """
    Class-based view for user registration.
    Wraps the register_user function for better integration with DRF's class-based views.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @swagger_auto_schema(
        operation_description="Register a new user",
        request_body=UserSerializer,
        responses={
            201: openapi.Response(
                description="User registered successfully",
                schema=UserSerializer
            ),
            400: 'Bad Request - Invalid data',
            500: 'Internal Server Error'
        }
    )
    def post(self, request, *args, **kwargs):
        """Handle POST request for user registration."""
        return register_user(request)

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.
    - Superadmins can manage all users
    - Admins can manage users in their organization
    - Users can view/edit their own profile
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsSuperAdmin | IsAdminOrSelf]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """
        Disable default user creation.
        Users should register through /users/register/ endpoint instead.
        """
        return Response(
            {"detail": "Use /users/register/ endpoint for user registration"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
        
    def get_queryset(self):
        """
        Filter users based on the requesting user's role.
        """
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()
            
        queryset = User.objects.all()
        
        # Superadmins can see all users
        if user.role == 'superadmin':
            return queryset
            
        # Admins can see users in their organization
        if hasattr(user, 'admin'):
            return queryset.filter(
                Q(admin__organization=user.admin.organization) |
                Q(salesperson__organization=user.admin.organization) |
                Q(verifier__organization=user.admin.organization) |
                Q(projectmanager__organization=user.admin.organization) |
                Q(developer__organization=user.admin.organization) |
                Q(support__organization=user.admin.organization)
            ).distinct()
            
        # Regular users can only see themselves
        return queryset.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the current user's profile.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'], url_path='me')
    def update_me(self, request):
        """
        Update the current user's profile.
        """
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
        
    def perform_create(self, serializer):
        """
        Set default role to 'user' for new users unless created by superadmin.
        """
        # Set default role to 'user' if not provided
        if 'role' not in serializer.validated_data:
            serializer.validated_data['role'] = 'user'
            
        # Only allow superadmins to assign roles other than 'user'
        if (serializer.validated_data.get('role') != 'user' and 
            not (self.request.user.is_authenticated and 
                 self.request.user.role == 'superadmin')):
            serializer.validated_data['role'] = 'user'
            
        return super().perform_create(serializer)
        
    def is_user_in_organization(self, user, target_user):
        """
        Check if both users are in the same organization.
        """
        # Superadmins can manage all users
        if user.role == 'superadmin':
            return True
            
        # Admin can manage users in their organization
        if hasattr(user, 'admin') and user.admin.organization:
            # Check if target user is in the same organization
            if hasattr(target_user, 'admin') and target_user.admin.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'salesperson') and target_user.salesperson.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'verifier') and target_user.verifier.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'projectmanager') and target_user.projectmanager.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'developer') and target_user.developer.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'support') and target_user.support.organization == user.admin.organization:
                return True
        return False

    def perform_update(self, serializer):
        """
        Allow superadmins and organization admins to change roles.
        """
        user = self.request.user
        target_user = serializer.instance
        
        # Only allow role changes for superadmins or organization admins
        if 'role' in serializer.validated_data:
            if not (user.is_authenticated and 
                   (user.role == 'superadmin' or 
                    (user.role == 'admin' and self.is_user_in_organization(user, target_user)))):
                # Remove role from validated data to prevent changes
                serializer.validated_data.pop('role')
            
            # Prevent admins from assigning superadmin role
            if (user.role != 'superadmin' and 
                serializer.validated_data.get('role') == 'superadmin'):
                serializer.validated_data['role'] = target_user.role
                
        return super().perform_update(serializer)


class UserRoleUpdateView(APIView):
    """
    API endpoint to update a user's role.
    Accessible by superadmins and organization admins for users in their organization.
    """
    permission_classes = [IsAuthenticated]
    
    def is_user_in_organization(self, user, target_user):
        """
        Check if both users are in the same organization.
        """
        # Superadmins can manage all users
        if user.role == 'superadmin':
            return True
            
        # Admin can manage users in their organization
        if hasattr(user, 'admin') and user.admin.organization:
            # Check if target user is in the same organization
            if hasattr(target_user, 'admin') and target_user.admin.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'salesperson') and target_user.salesperson.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'verifier') and target_user.verifier.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'projectmanager') and target_user.projectmanager.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'developer') and target_user.developer.organization == user.admin.organization:
                return True
            if hasattr(target_user, 'support') and target_user.support.organization == user.admin.organization:
                return True
        return False
    
    def patch(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            user = request.user
            
            # Check permissions
            if user.role != 'superadmin' and not (user.role == 'admin' and self.is_user_in_organization(user, target_user)):
                return Response(
                    {"detail": "You do not have permission to modify this user's role"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prevent modifying other superadmins unless it's self
            if target_user.role == 'superadmin' and target_user != user:
                return Response(
                    {"detail": "Cannot modify other superadmin roles"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            new_role = request.data.get('role')
            if not new_role:
                return Response(
                    {"detail": "Role is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate the role
            valid_roles = dict(User.RoleChoices.choices)
            if new_role not in valid_roles:
                return Response(
                    {"detail": f"Invalid role. Must be one of: {', '.join(valid_roles.keys())}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Prevent non-superadmins from assigning superadmin role
            if new_role == 'superadmin' and user.role != 'superadmin':
                return Response(
                    {"detail": "Only superadmins can assign the superadmin role"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prevent admins from assigning admin role unless they are superadmin
            if new_role == 'admin' and user.role != 'superadmin':
                return Response(
                    {"detail": "Only superadmins can assign the admin role"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update the role
            target_user.role = new_role
            target_user.save()
            
            return Response({
                "detail": "Role updated successfully",
                "user_id": str(target_user.id),
                "new_role": new_role
            })
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
