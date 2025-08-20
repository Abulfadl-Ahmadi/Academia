from django.core.management.base import BaseCommand
from django.contrib import admin


class Command(BaseCommand):
    help = 'Show all registered admin models and their configurations'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Django Admin Models Registration Report'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        # Get all registered models
        registered_models = admin.site._registry
        
        app_models = {}
        for model, admin_class in registered_models.items():
            app_label = model._meta.app_label
            if app_label not in app_models:
                app_models[app_label] = []
            app_models[app_label].append((model, admin_class))
        
        for app_label, models in app_models.items():
            self.stdout.write(f'\n{self.style.WARNING(f"App: {app_label.upper()}")}')
            self.stdout.write('-' * 40)
            
            for model, admin_class in models:
                model_name = model._meta.model_name
                admin_class_name = admin_class.__class__.__name__
                
                # Get admin configuration details
                list_display = getattr(admin_class, 'list_display', None)
                list_filter = getattr(admin_class, 'list_filter', None)
                search_fields = getattr(admin_class, 'search_fields', None)
                
                self.stdout.write(f'  • {model_name.title()} ({admin_class_name})')
                if list_display:
                    self.stdout.write(f'    - List Display: {", ".join(list_display)}')
                if list_filter:
                    self.stdout.write(f'    - List Filter: {", ".join(list_filter)}')
                if search_fields:
                    self.stdout.write(f'    - Search Fields: {", ".join(search_fields)}')
        
        self.stdout.write(f'\n{self.style.SUCCESS(f"Total registered models: {len(registered_models)}")}')
        
        # Check for missing models
        self.stdout.write(f'\n{self.style.WARNING("Checking for unregistered models...")}')
        
        from django.apps import apps
        all_models = apps.get_models()
        unregistered = []
        
        for model in all_models:
            if model not in registered_models and model._meta.app_label in [
                'accounts', 'courses', 'contents', 'tests', 'shop', 'finance'
            ]:
                unregistered.append(model)
        
        if unregistered:
            self.stdout.write(self.style.ERROR('Unregistered models found:'))
            for model in unregistered:
                self.stdout.write(f'  - {model._meta.app_label}.{model._meta.model_name}')
        else:
            self.stdout.write(self.style.SUCCESS('All custom app models are registered!'))
