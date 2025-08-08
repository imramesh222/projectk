from django.core.management.base import BaseCommand
from celery import current_app

class Command(BaseCommand):
    help = 'List all registered Celery tasks'

    def handle(self, *args, **options):
        # Get all registered tasks
        tasks = list(sorted(current_app.tasks.keys()))
        
        # Filter out Django internal tasks
        tasks = [t for t in tasks if not t.startswith('celery.')]
        
        self.stdout.write(self.style.SUCCESS('Registered Celery tasks:'))
        for task in tasks:
            self.stdout.write(f'- {task}')
            
        self.stdout.write(self.style.SUCCESS(f'\nTotal: {len(tasks)} tasks'))
