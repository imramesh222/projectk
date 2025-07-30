from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserProfileSerializer
from .permissions import (
    IsSuperAdmin, IsAdmin, IsSalesperson, IsVerifier,
    IsProjectManager, IsDeveloper, IsSupport, IsAdminOrSelf
)
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()

class UserRegisterView(generics.CreateAPIView):
    """
    View for user registration.
    Anyone can register, but only admins can create users with admin privileges.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Only allow setting admin role if the requester is a superadmin
        if 'role' in serializer.validated_data and serializer.validated_data['role'] == 'admin':
            if not (self.request.user.is_authenticated and self.request.user.role == 'superadmin'):
                serializer.validated_data['role'] = 'client'  # Default to client role
        return super().perform_create(serializer)

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
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserRoleUpdateView(APIView):
    """
    API endpoint to update a user's role.
    Only accessible by superadmins.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def patch(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            
            # Prevent modifying other superadmins
            if target_user.role == 'superadmin' and target_user != request.user:
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
            
            # Additional validation for admin role
            if new_role == 'admin' and not request.user.role == 'superadmin':
                return Response(
                    {"detail": "Only superadmins can assign admin role"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            target_user.role = new_role
            target_user.save()
            
            return Response({
                "detail": "User role updated successfully",
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
