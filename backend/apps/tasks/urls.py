from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Define the application namespace
app_name = 'tasks'

# Create a router for ViewSets
router = DefaultRouter()
# Register your viewsets here
# router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    # Include all ViewSet URLs
    path('', include(router.urls)),
]