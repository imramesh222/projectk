from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    OrganizationViewSet,
    OrganizationMemberViewSet,
    DashboardViewSet,
    OrganizationAdminDashboardView,
    debug_organization_view
)

# Define the application namespace
app_name = 'organization'

# Create a viewset instance to use for URL patterns
organization_viewset = OrganizationViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
    'post': 'create',
    'get': 'list',
})

organization_member_viewset = OrganizationMemberViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

# URL patterns
urlpatterns = [
    # Debug endpoint
    path('organizations/debug/<uuid:pk>/', debug_organization_view, name='debug-organization'),
    
    # Dashboard endpoints
    path('dashboard/metrics/', DashboardViewSet.as_view(), name='dashboard-metrics'),
    path('dashboard/admin/overview/', OrganizationAdminDashboardView.as_view(), name='organization-admin-dashboard'),
    
    # Organization CRUD endpoints
    path('organizations/', 
         OrganizationViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='organization-list'),
    path('organizations/<uuid:pk>/', 
         OrganizationViewSet.as_view({
             'get': 'retrieve',
             'put': 'update',
             'patch': 'partial_update',
             'delete': 'destroy',
         }), 
         name='organization-detail'),
    
    # Organization member management
    path('organizations/<uuid:pk>/members/', 
         OrganizationViewSet.as_view({'get': 'members'}), 
         name='organization-members'),
         
    # Add member to organization
    path('organizations/<uuid:pk>/add-member/',
         OrganizationViewSet.as_view({'post': 'add_member'}),
         name='organization-add-member'),
         
    # Join organization (for self-registration)
    path('organizations/<uuid:pk>/join/',
         OrganizationViewSet.as_view({'post': 'join'}),
         name='organization-join'),
         
    # Organization member endpoints
    path('organization-members/', 
         OrganizationMemberViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='organization-member-list'),
    path('organization-members/<uuid:pk>/', 
         OrganizationMemberViewSet.as_view({
             'get': 'retrieve',
             'put': 'update',
             'patch': 'partial_update',
             'delete': 'destroy',
         }), 
         name='organization-member-detail'),
         
    # Developer-specific endpoints
    path('developers/',
         OrganizationMemberViewSet.as_view({'get': 'developers'}),
         name='organization-developers'),
]
