from django.urls import path, include
from rest_framework.routers import DefaultRouter


from .views import (
    OrganizationViewSet,
    OrganizationMemberViewSet,
    DashboardViewSet
)

# Define the application namespace
app_name = 'organization'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'organization-members', OrganizationMemberViewSet, basename='organization-member')

# Additional URL patterns that don't fit into ViewSets
urlpatterns = [
    # Dashboard endpoints
    path('dashboard/metrics/', DashboardViewSet.as_view(), name='dashboard-metrics'),
    
    # Include all ViewSet URLs
    path('', include(router.urls)),
    
    # Organization member management
    path('organizations/<uuid:org_id>/members/', 
         OrganizationViewSet.as_view({'get': 'members'}), 
         name='organization-members'),
         
    # Add member to organization
    path('organizations/<uuid:org_id>/add-member/',
         OrganizationViewSet.as_view({'post': 'add_member'}),
         name='organization-add-member'),
         
    # Join organization (for self-registration)
    path('organizations/<org_id>/join/',
         OrganizationViewSet.as_view({'post': 'join'}),
         name='organization-join'),
         
    # Developer-specific endpoints
    path('developers/',
         OrganizationMemberViewSet.as_view({'get': 'developers'}),
         name='organization-developers'),
]
