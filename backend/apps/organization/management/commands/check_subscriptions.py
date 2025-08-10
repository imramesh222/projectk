"""
Management command to check subscription plans and durations.
"""
from django.core.management.base import BaseCommand
from apps.organization.models import SubscriptionPlan, PlanDuration

class Command(BaseCommand):
    help = 'Check subscription plans and their durations'

    def handle(self, *args, **options):
        self.stdout.write("=== Subscription Plans ===")
        for plan in SubscriptionPlan.objects.all():
            self.stdout.write(f"\n{plan.name}:")
            self.stdout.write(f"  Description: {plan.description}")
            self.stdout.write(f"  Active: {plan.is_active}")
            self.stdout.write("  Durations:")
            
            durations = plan.durations.all().order_by('duration_months')
            if not durations.exists():
                self.stdout.write("    No durations found")
                continue
                
            for duration in durations:
                self.stdout.write(
                    f"    - {duration.duration_months} months: "
                    f"${duration.price:.2f} "
                    f"({duration.discount_percentage}% off)"
                    f"{' (default)' if duration.is_default else ''}"
                )
        
        self.stdout.write("\n=== End of Subscription Plans ===")
