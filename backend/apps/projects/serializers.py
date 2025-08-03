from rest_framework import serializers
from .models import Project  # Only import Project from current app
from apps.tasks.models import Task
from apps.support.models import SupportTicket
from apps.clients.models import Client
from apps.payments.models import Payment
from apps.users.serializers import UserSerializer

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'contact', 'salesperson']
        read_only_fields = ['id']
        ref_name = 'projects.Client'  # Unique ref_name to avoid conflicts

class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project model with primary key relationships.
    Use the related field names to get detailed information in the API.
    """
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'cost', 'discount', 
            'client', 'created_by', 'verifier', 'manager', 
            'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        depth = 1  # Show nested serialization one level deep

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model with primary key relationships.
    """
    class Meta:
        model = Task
        fields = ['id', 'title', 'status', 'developer', 'project', 'created_at']
        read_only_fields = ['id', 'created_at']
        depth = 1  # Show nested serialization one level deep

class SupportTicketSerializer(serializers.ModelSerializer):
    """
    Serializer for SupportTicket model in projects app.
    """
    class Meta:
        model = SupportTicket
        fields = ['id', 'issue', 'support', 'project', 'created_at']
        read_only_fields = ['id', 'created_at']
        depth = 1  # Show nested serialization one level deep
        ref_name = 'projects.SupportTicket'  # Unique ref_name to avoid conflicts

class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model in projects app.
    """
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'verified', 'project', 'created_at']
        read_only_fields = ['id', 'created_at']
        depth = 1  # Show nested serialization one level deep
        ref_name = 'projects.Payment'  # Unique ref_name to avoid conflicts