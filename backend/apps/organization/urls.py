from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, AdminAssignmentViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'admin-assignments', AdminAssignmentViewSet)

urlpatterns = router.urls
