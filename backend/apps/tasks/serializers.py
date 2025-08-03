from django.utils import timezone
from rest_framework import serializers
from .models import Task
from apps.organization.serializers import DeveloperSerializer
from apps.projects.serializers import ProjectSerializer

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for the Task model with nested developer and project details.
    """
    developer_details = DeveloperSerializer(source='developer', read_only=True)
    project_details = ProjectSerializer(source='project', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'developer', 'developer_details', 'project', 'project_details',
            'due_date', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']
        extra_kwargs = {
            'developer': {'write_only': True},
            'project': {'write_only': True},
        }

    def validate(self, data):
        """
        Validate that the developer belongs to the project's organization.
        """
        developer = data.get('developer')
        project = data.get('project')
        
        if developer and project and developer.organization != project.organization:
            raise serializers.ValidationError(
                "The developer must belong to the same organization as the project."
            )
            
        return data
        
    def update(self, instance, validated_data):
        """
        Handle status updates and set completion date when task is marked as completed.
        """
        # If status is being updated to 'completed', set the completed_at timestamp
        if 'status' in validated_data and validated_data['status'] == 'completed':
            validated_data['completed_at'] = timezone.now()
        elif 'status' in validated_data and instance.status == 'completed' and validated_data['status'] != 'completed':
            # If status was completed but is being changed to something else, clear completed_at
            validated_data['completed_at'] = None
            
        return super().update(instance, validated_data)

class TaskListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing tasks with minimal information.
    """
    developer_name = serializers.CharField(source='developer.user.get_full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'status', 'priority', 'due_date',
            'developer_name', 'project_title'
        ]
        read_only_fields = fields