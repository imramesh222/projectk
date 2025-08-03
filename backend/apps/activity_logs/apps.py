from django.apps import AppConfig


class ActivityLogsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.activity_logs'
    verbose_name = 'Activity Logs'
    
    def ready(self):
        # Import signals
        from . import signals  # noqa
