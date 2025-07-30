from rest_framework.routers import DefaultRouter
from .views import SupportTicketViewSet
from django.urls import path, include

# Define the application namespace
app_name = 'support'

router = DefaultRouter()
router.register(r'support-tickets', SupportTicketViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
