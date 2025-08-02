from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import (
    api_view, 
    permission_classes,
    authentication_classes
)
from .serializers import UserSerializer

class CurrentUserView(APIView):
    """
    Get the current user's details including their role.
    This endpoint is used to display the welcome message after login.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return the current user's details including their role."""
        serializer = UserSerializer(request.user, context={'request': request})
        return Response({
            'user': serializer.data,
            'welcome_message': f"Welcome, {request.user.get_full_name() or request.user.username}!",
            'role': request.user.get_role_display() if hasattr(request.user, 'get_role_display') else 'User',
            'is_superuser': request.user.is_superuser,
            'is_staff': request.user.is_staff,
        })
