from rest_framework import viewsets, permissions
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'salesperson':
            return Client.objects.filter(salesperson=user)
        elif user.role == 'admin':
            return Client.objects.filter(organization=user.admin.organization)
        return Client.objects.none()

    def perform_create(self, serializer):
        serializer.save(salesperson=self.request.user)
