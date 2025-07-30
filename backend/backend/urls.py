"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

schema_view = get_schema_view(
   openapi.Info(
      title="SAMPLE PROJECT API",
      default_version='v1',
      description="API documentation for Sample project",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@example.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
   # authentication_classes=[],  # Optional, can be left out
)

# Add CSRF-exempt Swagger URLs
urlpatterns = [
    # API Documentation
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', csrf_exempt(schema_view.with_ui('swagger', cache_timeout=0)), name='schema-swagger-ui'),
    path('redoc/', csrf_exempt(schema_view.with_ui('redoc', cache_timeout=0)), name='schema-redoc'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include([
        # Authentication & Users
        path('auth/', include('rest_framework.urls', namespace='rest_framework')),
        path('users/', include('apps.users.urls', namespace='users')),
        
        # Organization Management
        path('org/', include('apps.organization.urls', namespace='organization')),
        
        # Core Functionality
        path('clients/', include('apps.clients.urls', namespace='clients')),
        path('projects/', include('apps.projects.urls', namespace='projects')),
        path('tasks/', include('apps.tasks.urls', namespace='tasks')),
        
        # Support & Communication
        path('support/', include('apps.support.urls', namespace='support')),
        
        # Notifications
        path('notifications/', include('apps.notifications.urls', namespace='notifications')),
        
        # Billing & Payments
        path('billing/', include('apps.payments.urls', namespace='payments')),
    ]))

]

if settings.DEBUG:
    urlpatterns += [
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    ]