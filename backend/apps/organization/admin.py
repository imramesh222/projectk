from django.contrib import admin
from .models import Organization, AdminAssignment, Salesperson, Verifier, ProjectManager, Developer, Support

class AdminAssignmentAdmin(admin.ModelAdmin):
    list_display = ('admin_username', 'organization_name')
    
    def admin_username(self, obj):
        return obj.admin.username
    admin_username.short_description = 'Admin'
    
    def organization_name(self, obj):
        return obj.organization.name
    organization_name.short_description = 'Organization'

class UserOrganizationAdmin(admin.ModelAdmin):
    list_display = ('user_username', 'organization_name')
    
    def user_username(self, obj):
        return obj.user.username
    user_username.short_description = 'User'
    
    def organization_name(self, obj):
        return obj.organization.name
    organization_name.short_description = 'Organization'

admin.site.register(Organization)
admin.site.register(AdminAssignment, AdminAssignmentAdmin)
admin.site.register(Salesperson, UserOrganizationAdmin)
admin.site.register(Verifier, UserOrganizationAdmin)
admin.site.register(ProjectManager, UserOrganizationAdmin)
admin.register(Developer, UserOrganizationAdmin)
admin.site.register(Support, UserOrganizationAdmin)
