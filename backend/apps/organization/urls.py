from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, AdminAssignmentViewSet

# Define the application namespace
app_name = 'organization'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'admin-assignments', AdminAssignmentViewSet, basename='admin-assignment')

# Additional URL patterns that don't fit into ViewSets
urlpatterns = [
    # Include all ViewSet URLs
    path('', include(router.urls)),
    
    # Organization-specific endpoints
    path('organizations/<uuid:pk>/members/', 
         OrganizationViewSet.as_view({'get': 'members'}), 
         name='organization-members'),
    
    # Admin assignment actions
    path('admin-assignments/<uuid:pk>/deactivate/', 
         AdminAssignmentViewSet.as_view({'post': 'deactivate'}), 
         name='admin-assignment-deactivate'),
    path('admin-assignments/<uuid:pk>/reactivate/', 
         AdminAssignmentViewSet.as_view({'post': 'reactivate'}), 
         name='admin-assignment-reactivate'),
]
