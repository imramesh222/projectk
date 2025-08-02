from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OrganizationViewSet,
    OrganizationMemberViewSet
)

# Define the application namespace
app_name = 'organization'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'organization-members', OrganizationMemberViewSet, basename='organization-member')

# Additional URL patterns that don't fit into ViewSets
urlpatterns = [
    # Include all ViewSet URLs
    path('', include(router.urls)),
    
    # Organization member management
    path('organizations/<uuid:pk>/members/', 
         OrganizationViewSet.as_view({'get': 'members'}), 
         name='organization-members'),
    path('organizations/<uuid:org_id>/invite/',
         OrganizationViewSet.as_view({'post': 'invite_member'}),
         name='organization-invite'),
    path('organizations/<uuid:org_id>/members/<uuid:member_id>/',
         OrganizationViewSet.as_view({
             'get': 'retrieve_member',
             'patch': 'update_member',
             'delete': 'remove_member'
         }),
         name='organization-member-detail'),
    path('organizations/<uuid:org_id>/members/<uuid:member_id>/activate/',
         OrganizationViewSet.as_view({'post': 'activate_member'}),
         name='organization-member-activate'),
    path('organizations/<uuid:org_id>/members/<uuid:member_id>/deactivate/',
         OrganizationViewSet.as_view({'post': 'deactivate_member'}),
         name='organization-member-deactivate'),
]
