from rest_framework import viewsets, permissions
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Notification.objects.none()

    def get_queryset(self):
        # Handle Swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
            
        # Handle unauthenticated users (shouldn't happen due to permissions, but just in case)
        if not self.request.user.is_authenticated:
            return Notification.objects.none()
            
        return self.request.user.notifications.order_by('-created_at')
