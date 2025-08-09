from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.ActivityLogViewSet, basename='activity-log')

app_name = 'activity_logs'

urlpatterns = [
    path('', include(router.urls)),
]
