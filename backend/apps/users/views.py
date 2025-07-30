from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny

User = get_user_model()

class IsSuperAdmin(BasePermission):
    """Allows access only to superadmins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'superadmin')

class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserRoleUpdateView(APIView):
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
