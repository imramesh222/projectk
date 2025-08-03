from django.urls import path
from . import views
from .base_views import (
    SuperAdminDashboardView,
    OrganizationAdminDashboardView,
    # Other views will be added as they're implemented
)

app_name = 'dashboard'

# Role-based dashboard endpoints
urlpatterns = [
    # Super Admin Dashboard
    path('superadmin/overview/', SuperAdminDashboardView.as_view(), name='superadmin-overview'),
    
    # Organization Admin Dashboard
    path('admin/overview/', OrganizationAdminDashboardView.as_view(), name='admin-overview'),
    
    # Project Manager Dashboard (to be implemented)
    path('manager/overview/', views.ProjectManagerDashboardView.as_view(), name='manager-overview'),
    
    # Developer Dashboard (to be implemented)
    path('developer/overview/', views.DeveloperDashboardView.as_view(), name='developer-overview'),
    
    # Sales Dashboard (to be implemented)
    path('sales/overview/', views.SalesDashboardView.as_view(), name='sales-overview'),
    
    # Support Dashboard (to be implemented)
    path('support/overview/', views.SupportDashboardView.as_view(), name='support-overview'),
    
    # Verifier Dashboard (to be implemented)
    path('verifier/overview/', views.VerifierDashboardView.as_view(), name='verifier-overview'),
    
    # Common endpoints
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('notifications/', views.UserNotificationsView.as_view(), name='user-notifications'),
    path('search/', views.GlobalSearchView.as_view(), name='global-search'),
]
