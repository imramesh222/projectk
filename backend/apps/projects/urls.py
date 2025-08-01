from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet

# Define the application namespace
app_name = 'projects'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

# Additional URL patterns that don't fit into ViewSets
urlpatterns = [
    # Include all ViewSet URLs
    path('', include(router.urls)),
    
    # Project verification endpoint
    path('projects/<uuid:pk>/verify/', 
         ProjectViewSet.as_view({'post': 'verify'}), 
         name='project-verify'),
]