from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegisterView, UserRoleUpdateView, UserViewSet

# Define the application namespace
app_name = 'users'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

# Additional URL patterns that don't fit into ViewSets
urlpatterns = [
    # User registration
    path('register/', UserRegisterView.as_view(), name='user-register'),
    
    # User role management (admin only)
    path('<uuid:user_id>/update-role/', UserRoleUpdateView.as_view(), name='user-update-role'),
    
    # Include all ViewSet URLs
    path('', include(router.urls)),
    
    # Authentication endpoints (if using DRF's built-in auth)
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
]
