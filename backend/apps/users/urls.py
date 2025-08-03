from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import UserRegisterView, UserRoleUpdateView, UserViewSet

# Define the application namespace
app_name = 'users'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

# Additional URL patterns that don't fit into ViewSets
urlpatterns = [
    # User registration - using dedicated view with CSRF exemption handled in the view
    path('register/', UserRegisterView.as_view(), name='user-register'),
    
    # JWT Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # User role management (admin only)
    path('<uuid:user_id>/update-role/', UserRoleUpdateView.as_view(), name='user-update-role'),
    
    # Include router URLs last
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
]
