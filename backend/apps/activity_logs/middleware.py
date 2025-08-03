import time
from django.utils.deprecation import MiddlewareMixin
from .models import ActivityType
from .utils import log_activity

class ActivityLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log user activities.
    """
    def process_request(self, request):
        # Skip logging for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
            
        # Set start time on request for response time calculation
        request._start_time = time.time()
        return None

    def process_response(self, request, response):
        # Skip logging for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return response
            
        # Calculate response time
        response_time = 0
        if hasattr(request, '_start_time'):
            response_time = time.time() - request._start_time
        
        # Log the activity if user is authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Skip logging for specific endpoints if needed
            if any(path in request.path for path in ['/api/v1/activity/', '/health/']):
                return response
                
            # Determine activity type based on request method
            activity_type = ActivityType.UPDATE
            if request.method == 'POST':
                activity_type = ActivityType.CREATE
            elif request.method == 'DELETE':
                activity_type = ActivityType.DELETE
                
            # Log the activity
            log_activity(
                user=request.user,
                activity_type=activity_type,
                request=request,
                object_type=request.resolver_match.app_name if hasattr(request, 'resolver_match') else None,
                object_id=request.resolver_match.kwargs.get('pk') if hasattr(request, 'resolver_match') and request.resolver_match else None,
                details={
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'response_time': response_time,
                }
            )
            
        return response
