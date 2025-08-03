from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class ActivityType(models.TextChoices):
    LOGIN = 'login', _('User Login')
    LOGOUT = 'logout', _('User Logout')
    CREATE = 'create', _('Create')
    UPDATE = 'update', _('Update')
    DELETE = 'delete', _('Delete')
    PASSWORD_CHANGE = 'password_change', _('Password Change')
    PROFILE_UPDATE = 'profile_update', _('Profile Update')
    SETTINGS_UPDATE = 'settings_update', _('Settings Update')

class ActivityLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities'
    )
    activity_type = models.CharField(
        max_length=50,
        choices=ActivityType.choices,
        default=ActivityType.UPDATE
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    object_type = models.CharField(max_length=100, blank=True, null=True)
    object_id = models.CharField(max_length=100, blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Activity Log')
        verbose_name_plural = _('Activity Logs')

    def __str__(self):
        return f"{self.get_activity_type_display()} by {self.user} at {self.created_at}"
