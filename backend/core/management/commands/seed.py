import random
import logging
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from core.models import (
    CTNIStats,
    CPXStats,
    AirportStats,
    StateStats,
    OfficeStats,
    State,
    PostalOffice,
    Alert,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Seeds database with CTNI, CPX, Airport, State, and Office stats, plus random alerts"

    def handle(self, *args, **options):
        try:
            logger.info("🧹 Clearing old records...")
            models_to_clear = [
                CTNIStats,
                CPXStats,
                AirportStats,
                StateStats,
                OfficeStats,
                Alert,
            ]
            for model in models_to_clear:
                count = model.objects.count()
                if count > 0:
                    model.objects.all().delete()
                    logger.info(f"🗑️ Deleted {count} {model.__name__} records.")
                else:
                    logger.info(f"ℹ️ No {model.__name__} records to delete.")

            logger.info("✅ Old data cleared.\n")

            # --- Create KPI base records ---
            logger.info("📊 Creating CTNI, CPX, and Airport stats records...")

            CTNIStats.objects.create(
                ctni_pre_arrived_dispatches_count=-1,
                ctni_items_delivered=-1,
                ctni_items_delivered_after_one_fail=-1,
                ctni_undelivered_items=-1,
                ctni_delivery_rate=-0.1,
                ctni_on_time_delivery_rate=-0.1,
                ctni_items_blocked_in_customs=-1,
                ctni_returned_items=-1,
                ctni_consolidation_time="P1D",
                ctni_end_to_end_transit_time_average="P1D",
                ctni_shipment_consolidation_time="P1D",
                ctni_unscanned_items=-1,
                ctni_items_exceeding_holding_time=-1,
            )

            CPXStats.objects.create(
                cpx_pre_arrived_dispatches_count=-1,
                cpx_items_delivered=-1,
                cpx_items_delivered_after_one_fail=-1,
                cpx_undelivered_items=-1,
                cpx_delivery_rate=-0.1,
                cpx_on_time_delivery_rate=-0.1,
                cpx_items_blocked_in_customs=-1,
                cpx_returned_items=-1,
                cpx_consolidation_time="P1D",
                cpx_end_to_end_transit_time_average="P1D",
                cpx_shipment_consolidation_time="P1D",
                cpx_unscanned_items=-1,
                cpx_items_exceeding_holding_time=-1,
            )

            AirportStats.objects.create(
                airport_pre_arrived_dispatches_count=-1,
                airport_items_delivered=-1,
                airport_items_delivered_after_one_fail=-1,
                airport_undelivered_items=-1,
                airport_delivery_rate=-0.1,
                airport_on_time_delivery_rate=-0.1,
                airport_items_blocked_in_customs=-1,
                airport_returned_items=-1,
                airport_consolidation_time="P1D",
                airport_end_to_end_transit_time_average="P1D",
                airport_shipment_consolidation_time="P1D",
                airport_unscanned_items=-1,
                airport_items_exceeding_holding_time=-1,
            )

            logger.info("✅ KPI base records created.\n")

            # --- State Stats ---
            logger.info("🏛️ Creating StateStats for all states...")
            states = list(State.objects.all())
            state_stats = [
                StateStats(
                    state=s,
                    pre_arrived_dispatches_count=random.randint(50, 500),
                    items_delivered=random.randint(500, 1500),
                    undelivered_items=random.randint(10, 100),
                )
                for s in states
            ]
            StateStats.objects.bulk_create(state_stats)
            logger.info(f"✅ Created {len(state_stats)} StateStats records.")

            # --- Office Stats ---
            logger.info("🏢 Creating OfficeStats for all postal offices...")
            offices = list(PostalOffice.objects.all())
            office_stats = [
                OfficeStats(
                    office=o,
                    pre_arrived_dispatches_count=random.randint(10, 200),
                    items_delivered=random.randint(100, 600),
                    undelivered_items=random.randint(5, 40),
                )
                for o in offices
            ]
            OfficeStats.objects.bulk_create(office_stats)
            logger.info(f"✅ Created {len(office_stats)} OfficeStats records.")

            # --- Random Alerts ---
            logger.info("🚨 Creating random alerts for each state...")
            alerts = []
            alarm_choices = [choice[0] for choice in Alert.AlarmType.choices]
            severities = ["low", "medium", "high"]

            for state in states:
                for _ in range(random.randint(1, 3)):  # 1–3 alerts per state
                    alarm_code = random.choice(alarm_choices)
                    alerts.append(
                        Alert(
                            state=state,
                            alarm_code=alarm_code,
                            title=f"Alerte {alarm_code} pour {state.name}",
                            trigger_condition="Condition simulée aléatoire",
                            severity=random.choice(severities),
                            action_required="Vérifier et prendre des mesures correctives",
                            acknowledged=random.choice([True, False]),
                            timestamp=timezone.now(),
                        )
                    )

            Alert.objects.bulk_create(alerts)
            logger.info(f"✅ Created {len(alerts)} alerts for states.")

            logger.info("🎉 Database seeding complete!")

        except Exception as e:
            logger.exception("❌ Seeder encountered an error:")
            raise CommandError(f"Seeder failed: {e}")
