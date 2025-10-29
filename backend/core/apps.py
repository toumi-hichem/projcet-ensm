from django.apps import AppConfig
import threading


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        from core.signals import seed_algeria_data

        # Run seed in a separate thread to avoid blocking startup
        def run_seed():
            try:
                seed_algeria_data()
            except Exception as e:
                import logging

                logger = logging.getLogger(__name__)
                logger.exception(f"❌ Failed to seed Algeria data: {e}")

        threading.Thread(target=run_seed, daemon=True).start()
