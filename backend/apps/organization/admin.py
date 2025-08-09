from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.db.models import Q
from django.utils.html import format_html
from .models import Organization, OrganizationMember, OrganizationRoleChoices, SubscriptionPlan, PlanDuration, OrganizationSubscription

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

class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('user_info', 'organization_name', 'role_display', 'is_active', 'created_at')
    list_filter = ('organization__name', 'role', 'is_active', 'created_at')
    search_fields = (
        'user__username',
        'user__email',
        'user__first_name',
        'user__last_name',
        'organization__name'
    )
    list_select_related = ('user', 'organization')
    autocomplete_fields = ('user', 'organization')
    readonly_fields = ('created_at', 'updated_at')
    
    # Add a custom filter for organization
    class OrganizationFilter(admin.SimpleListFilter):
        title = 'Organization'  # or use _('organization') for translation
        parameter_name = 'organization'

        def lookups(self, request, model_admin):
            # Get unique organization names
            organizations = Organization.objects.values_list('id', 'name').distinct()
            return [(id, name) for id, name in organizations]

        def queryset(self, request, queryset):
            if self.value():
                return queryset.filter(organization_id=self.value())
            return queryset
    
    # Override the default list filter to use our custom filter
    list_filter = (OrganizationFilter, 'role', 'is_active', 'created_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'organization')
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Ensure we can select any user for the role
        if 'user' in form.base_fields:
            form.base_fields['user'].queryset = User.objects.all()
        return form
        
    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        if search_term:
            # Search in user fields and organization name
            user_query = Q()
            for term in search_term.split():
                user_query &= (
                    Q(user__username__icontains=term) |
                    Q(user__email__icontains=term) |
                    Q(user__first_name__icontains=term) |
                    Q(user__last_name__icontains=term) |
                    Q(organization__name__icontains=term)
                )
            queryset = queryset.filter(user_query)
        return queryset, use_distinct
        
    def user_info(self, obj):
        return format_html(
            '{}<br><small class="quiet">{}</small>',
            obj.user.get_full_name() or obj.user.username,
            obj.user.email
        )
    user_info.short_description = 'User'
    user_info.admin_order_field = 'user__username'
    
    def organization_name(self, obj):
        return obj.organization.name
    organization_name.short_description = 'Organization'
    organization_name.admin_order_field = 'organization__name'
    
    def role_display(self, obj):
        return dict(OrganizationRoleChoices.choices).get(obj.role, obj.role)
    role_display.short_description = 'Role'


class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'member_count', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'member_count')
    
    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'

# Subscription Admin
class PlanDurationInline(admin.TabularInline):
    model = PlanDuration
    extra = 1
    fields = ('duration_months', 'price', 'discount_percentage', 'is_default', 'is_active')

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    inlines = [PlanDurationInline]

@admin.register(OrganizationSubscription)
class OrganizationSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan_duration', 'is_active', 'auto_renew', 'start_date', 'end_date')
    list_filter = ('is_active', 'auto_renew', 'start_date', 'end_date')
    search_fields = ('organization__name', 'plan_duration__plan__name')
    list_select_related = ('organization', 'plan_duration__plan')

# Register models
admin.site.register(Organization, OrganizationAdmin)
admin.site.register(OrganizationMember, OrganizationMemberAdmin)

# Unregister the default Group admin
admin.site.unregister(Group)
