from rest_framework import viewsets, permissions
from .models import Organization, AdminAssignment
from .serializers import OrganizationSerializer, AdminAssignmentSerializer
from apps.users.models import User
from apps.notifications.utils import send_notification_to_admin
from django.core.mail import send_mail
from django.conf import settings

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

class AdminAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AdminAssignment.objects.all()
    serializer_class = AdminAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        admin_user = serializer.validated_data['admin']
        org = serializer.validated_data['organization']
        serializer.save()

        # Send email with temporary password or info
        send_mail(
            subject='You have been assigned as an admin',
            message=f"You are assigned as the admin of {org.name}. Please login and change your password.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_user.email]
        )

        # Send real-time notification
        send_notification_to_admin(
            user=admin_user,
            message=f"You have been successfully assigned as admin to {org.name}"
        )
