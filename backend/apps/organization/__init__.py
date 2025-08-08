# This ensures Celery can find and register tasks
# Import tasks module to register tasks with Celery
from .tasks import *  # noqa

# Using lazy imports to prevent circular imports
def __getattr__(name):
    if name in {'get_user_organization_role', 'has_organization_permission', 'get_organization_members'}:
        from . import utils
        return getattr(utils, name)
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

__all__ = [
    'get_user_organization_role',
    'has_organization_permission',
    'get_organization_members',
]