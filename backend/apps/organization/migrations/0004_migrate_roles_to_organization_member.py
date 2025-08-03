from django.db import migrations
from django.utils import timezone


def migrate_roles(apps, schema_editor):
    """Migrate data from old role models to OrganizationMember."""
    # Get models
    OrganizationMember = apps.get_model('organization', 'OrganizationMember')
    AdminAssignment = apps.get_model('organization', 'AdminAssignment')
    Salesperson = apps.get_model('organization', 'Salesperson')
    Verifier = apps.get_model('organization', 'Verifier')
    ProjectManager = apps.get_model('organization', 'ProjectManager')
    Developer = apps.get_model('organization', 'Developer')
    Support = apps.get_model('organization', 'Support')
    
    # Map old models to their respective roles and user field names
    role_mapping = [
        (AdminAssignment, 'admin', 'admin'),  # (model, role, user_field)
        (Salesperson, 'salesperson', 'user'),
        (Verifier, 'verifier', 'user'),
        (ProjectManager, 'project_manager', 'user'),
        (Developer, 'developer', 'user'),
        (Support, 'support', 'user')
    ]
    
    created_count = 0
    skipped_count = 0
    
    for model, role, user_field in role_mapping:
        # Get all instances of the old model
        for instance in model.objects.all():
            # Get the user from the appropriate field
            user = getattr(instance, user_field)
            
            # Check if this user already has an OrganizationMember for this organization
            if not OrganizationMember.objects.filter(
                user=user,
                organization=instance.organization
            ).exists():
                # Create new OrganizationMember
                OrganizationMember.objects.create(
                    user=user,
                    organization=instance.organization,
                    role=role,
                    is_active=True,
                    created_at=getattr(instance, 'created_at', timezone.now()),
                    updated_at=getattr(instance, 'updated_at', timezone.now())
                )
                created_count += 1
            else:
                skipped_count += 1
    
    print(f"Migration complete. Created {created_count} OrganizationMember records. "
          f"Skipped {skipped_count} duplicates.")


def reverse_migrate(apps, schema_editor):
    """Print a warning since this migration cannot be cleanly reversed.
    
    Reversing this migration would be complex and potentially destructive,
    so we'll just print a message instead of actually reversing.
    """
    print("Warning: This migration cannot be cleanly reversed. "
          "No data will be deleted from OrganizationMember.")


class Migration(migrations.Migration):
    dependencies = [
        ('organization', '0003_alter_adminassignment_admin'),
    ]

    operations = [
        migrations.RunPython(migrate_roles, reverse_migrate),
    ]
