from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet
from django.urls import path, include

# Define the application namespace
app_name = 'payments'

router = DefaultRouter()
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]