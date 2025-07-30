from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet

# Define the application namespace
app_name = 'clients'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'', ClientViewSet, basename='client')

# Additional URL patterns that don't fit into ViewSets
urlpatterns = [
    # Include all ViewSet URLs
    path('', include(router.urls)),
    
    # Additional client-related endpoints
    path('<uuid:pk>/activate/', ClientViewSet.as_view({'post': 'activate'}), name='client-activate'),
    path('<uuid:pk>/deactivate/', ClientViewSet.as_view({'post': 'deactivate'}), name='client-deactivate'),
]
