from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.db.models import Q
from .models import Organization, AdminAssignment, Salesperson, Verifier, ProjectManager, Developer, Support

User = get_user_model()

class CustomUserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff')
    list_filter = ('is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions')

# Unregister the default User admin if it's registered
if admin.site.is_registered(User):
    admin.site.unregister(User)

# Register our custom User admin
admin.site.register(User, CustomUserAdmin)

class UserOrganizationAdmin(admin.ModelAdmin):
    list_display = ('user_username', 'user_email', 'organization_name', 'created_at')
    list_filter = ('organization', 'created_at')
    search_fields = (
        'user__username',
        'user__email',
        'user__first_name',
        'user__last_name',
        'organization__name'
    )
    autocomplete_fields = ('user', 'organization')
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['user'].queryset = User.objects.all()
        return form
        
    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        try:
            # Try to find users by username, email, first name, or last name
            users = User.objects.filter(
                Q(username__icontains=search_term) |
                Q(email__icontains=search_term) |
                Q(first_name__icontains=search_term) |
                Q(last_name__icontains=search_term)
            )
            queryset = queryset | self.model.objects.filter(user__in=users)
            use_distinct = True
        except (ValueError, User.DoesNotExist):
            pass
        return queryset, use_distinct
    
    def user_username(self, obj):
        return obj.user.username
    user_username.short_description = 'Username'
    user_username.admin_order_field = 'user__username'
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    user_email.admin_order_field = 'user__email'
    
    def organization_name(self, obj):
        return obj.organization.name
    organization_name.short_description = 'Organization'
    organization_name.admin_order_field = 'organization__name'

class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

class AdminAssignmentAdmin(admin.ModelAdmin):
    list_display = ('admin_username', 'admin_email', 'organization_name', 'created_at')
    list_filter = ('organization', 'created_at')
    search_fields = (
        'admin__username', 
        'admin__email', 
        'admin__first_name', 
        'admin__last_name',
        'organization__name'
    )
    autocomplete_fields = ('admin', 'organization')
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Remove the limit_choices_to filter for the admin field
        form.base_fields['admin'].queryset = User.objects.all()
        return form
    
    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        try:
            # Try to find users by username, email, first name, or last name
            users = User.objects.filter(
                Q(username__icontains=search_term) |
                Q(email__icontains=search_term) |
                Q(first_name__icontains=search_term) |
                Q(last_name__icontains=search_term)
            )
            queryset = queryset | self.model.objects.filter(admin__in=users)
            use_distinct = True
        except (ValueError, User.DoesNotExist):
            pass
        return queryset, use_distinct
    
    def admin_username(self, obj):
        return obj.admin.username
    admin_username.short_description = 'Admin Username'
    admin_username.admin_order_field = 'admin__username'
    
    def admin_email(self, obj):
        return obj.admin.email
    admin_email.short_description = 'Admin Email'
    admin_email.admin_order_field = 'admin__email'
    
    def organization_name(self, obj):
        return obj.organization.name
    organization_name.short_description = 'Organization'
    organization_name.admin_order_field = 'organization__name'

# Register models
admin.site.register(Organization, OrganizationAdmin)
admin.site.register(AdminAssignment, AdminAssignmentAdmin)
admin.site.register(Salesperson, UserOrganizationAdmin)
admin.site.register(Verifier, UserOrganizationAdmin)
admin.site.register(ProjectManager, UserOrganizationAdmin)
admin.site.register(Developer, UserOrganizationAdmin)
admin.site.register(Support, UserOrganizationAdmin)

# Unregister the default Group admin
admin.site.unregister(Group)
