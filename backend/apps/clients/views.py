from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from apps.users.permissions import (
    IsAuthenticated, IsAdmin, IsSalesperson, IsSuperAdmin, HasOrganizationAccess
)
from .models import Client
from .serializers import (
    ClientSerializer, ClientDetailSerializer, 
    ClientCreateSerializer, ClientUpdateSerializer
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing clients.
    - Superadmins can see all clients
    - Admins can see clients in their organization
    - Salespeople can see their own clients
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact', 'email', 'phone']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated, IsAdmin | IsSalesperson | IsSuperAdmin]
        else:
            permission_classes = [IsAuthenticated, HasOrganizationAccess]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Use different serializers for list and detail views.
        """
        if self.action == 'retrieve':
            return ClientDetailSerializer
        if self.action == 'create':
            return ClientCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ClientUpdateSerializer
        return ClientSerializer

    def get_queryset(self):
        """
        Filter clients based on the requesting user's role.
        """
        user = self.request.user
        queryset = super().get_queryset()

        # Apply filters from query params if provided
        organization_id = self.request.query_params.get('organization_id')
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
            
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        # Apply role-based filtering
        if user.role == 'superadmin':
            return queryset
            
        if user.role == 'admin':
            return queryset.filter(organization=user.organization)
            
        # Salespeople can only see their own clients
        return queryset.filter(assigned_to=user)

    def perform_create(self, serializer):
        """
        Set the salesperson to the current user and organization based on the salesperson's org.
        """
        user = self.request.user
        if hasattr(user, 'salesperson'):
            serializer.save(salesperson=user, organization=user.salesperson.organization)
        elif hasattr(user, 'admin'):
            # If admin is creating, they need to specify salesperson
            serializer.save(organization=user.admin.organization)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a client account.
        """
        client = self.get_object()
        client.is_active = True
        client.save()
        return Response({'status': 'client activated'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Deactivate a client account.
        """
        client = self.get_object()
        client.is_active = False
        client.save()
        return Response({'status': 'client deactivated'}, status=status.HTTP_200_OK)
