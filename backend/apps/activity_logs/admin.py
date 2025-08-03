from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import ActivityLog

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'activity_type_display', 'user_link', 'object_link', 'ip_address', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'object_type', 'ip_address', 'details')
    readonly_fields = ('created_at', 'user_agent', 'formatted_details')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Activity Information', {
            'fields': ('user', 'activity_type', 'created_at', 'ip_address', 'user_agent')
        }),
        ('Object Information', {
            'fields': ('object_type', 'object_id', 'formatted_details'),
            'classes': ('collapse',)
        }),
    )
    
    def activity_type_display(self, obj):
        return obj.get_activity_type_display()
    activity_type_display.short_description = 'Activity Type'
    
    def user_link(self, obj):
        if not obj.user:
            return "System"
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user)
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'
    
    def object_link(self, obj):
        if not obj.object_type or not obj.object_id:
            return "-"
        
        # Try to create a link to the admin change page for the object
        try:
            app_label = obj.object_type.lower()
            url = reverse(f'admin:{app_label}_{obj.object_type.lower()}_change', args=[obj.object_id])
            return format_html('<a href="{}">{} #{}</a>', url, obj.object_type, obj.object_id)
        except:
            return f"{obj.object_type} #{obj.object_id}"
    object_link.short_description = 'Object'
    
    def formatted_details(self, obj):
        if not obj.details:
            return "-"
        
        # Format the JSON data in a readable way
        import json
        formatted = json.dumps(obj.details, indent=2, ensure_ascii=False)
        return mark_safe(f'<pre>{formatted}</pre>')
    formatted_details.short_description = 'Details'
