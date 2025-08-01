from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet

# Define the application namespace
app_name = 'tasks'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    # Include all ViewSet URLs
    path('', include(router.urls)),
]