from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class OrganizationMemberSerializer(serializers.Serializer):
    """Serializer for organization membership information."""
    organization_id = serializers.UUIDField(source='organization.id')
    organization_name = serializers.CharField(source='organization.name')
    role = serializers.SerializerMethodField()
    
    def get_role(self, obj):
        # Check if this is an OrganizationMember instance
        if hasattr(obj, 'role'):
            return obj.role
            
        # Fallback to checking role-specific models
        if hasattr(obj, 'admin') and obj.is_active:
            return 'admin'
        if hasattr(obj, 'salesperson'):
            return 'salesperson'
        if hasattr(obj, 'verifier'):
            return 'verifier'
        if hasattr(obj, 'projectmanager'):
            return 'project_manager'
        if hasattr(obj, 'developer'):
            return 'developer'
        if hasattr(obj, 'support'):
            return 'support'
            
        return 'member'

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration and basic info.
    Includes password field for write operations only.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Password'},
        help_text="Required. Must be at least 8 characters long.",
        min_length=8
    )
    organization_memberships = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'is_active', 'date_joined', 'last_login', 
            'password', 'organization_memberships'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_active', 'organization_memberships']
        extra_kwargs = {
            'email': {
                'required': True,
                'help_text': 'Required. A valid email address.'
            },
            'username': {
                'required': True,
                'help_text': 'Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.'
            },
            'first_name': {
                'required': False,
                'help_text': 'Optional. User\'s first name.'
            },
            'last_name': {
                'required': False,
                'help_text': 'Optional. User\'s last name.'
            },
            'role': {
                'required': False,
                'default': 'user',
                'help_text': 'User role. Defaults to \'user\'. Options: user, admin, salesperson, verifier, project_manager, developer, support.'
            }
        }
    
    def get_organization_memberships(self, obj):
        """Get all organization memberships for the user."""
        from apps.organization.models import OrganizationMember
        memberships = OrganizationMember.objects.filter(user=obj)
        return OrganizationMemberSerializer(memberships, many=True).data
    
    def create(self, validated_data):
        """Create and return a new user with encrypted password."""
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        """Update a user, setting the password correctly if provided."""
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def validate_password(self, value):
        """
        Validate the password meets minimum requirements.
        """
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer to include additional user data in the token response.
    Also customizes the JWT token payload to include required fields.
    """
    @classmethod
    def get_token(cls, user):
        """
        Generate the token with custom claims.
        These claims will be included in the JWT token payload.
        """
        token = super().get_token(user)
        
        # Add custom claims
        token['user_id'] = str(user.id)
        token['email'] = user.email
        token['role'] = user.role
        token['username'] = user.username
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)
        
        # Add extra responses here
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        data['user'] = UserSerializer(self.user).data
        
        return data
