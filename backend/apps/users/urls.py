from django.urls import path
from .views import UserRegisterView, UserRoleUpdateView

urlpatterns = [
    path("register/", UserRegisterView.as_view(), name="user-register"),
    path("<uuid:user_id>/update-role/", UserRoleUpdateView.as_view(), name="user-update-role"),
]
