import json
import random
import logging
from django.core.management.base import BaseCommand, CommandError
from core.models import (
    CTNIStats,
    CPXStats,
    AirportStats,
    StateStats,
    OfficeStats,
)

logger = logging.getLogger(__name__)


# Usage:
# python manage.py seed --wilayas "core/data/wilayadata.json" --offices "core/data/wilaya_post_offices.json"
class Command(BaseCommand):
    help = "Seeds database with CTNI, CPX, Airport, State, and Office stats"

    def add_arguments(self, parser):
        parser.add_argument(
            "--wilayas", type=str, required=True, help="Path to wilayas JSON file"
        )
        parser.add_argument(
            "--offices", type=str, required=True, help="Path to offices JSON file"
        )

    def handle(self, *args, **options):
        try:
            logger.info("🧹 Clearing old records...")
            models_to_clear = [
                CTNIStats,
                CPXStats,
                AirportStats,
                StateStats,
                OfficeStats,
            ]
            for model in models_to_clear:
                count = model.objects.count()
                if count > 0:
                    model.objects.all().delete()
                    logger.info(f"🗑️ Deleted {count} {model.__name__} records.")
                else:
                    logger.info(f"ℹ️ No {model.__name__} records to delete.")

            logger.info("✅ Old data cleared.\n")

            wilayas_path = options["wilayas"]
            offices_path = options["offices"]

            logger.info(f"📂 Loading wilayas from {wilayas_path}")
            logger.info(f"📂 Loading offices from {offices_path}")
            with open(wilayas_path, "r", encoding="utf-8") as f:
                wilayas_data = json.load(f)
            with open(offices_path, "r", encoding="utf-8") as f:
                offices_data = json.load(f)

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

            # --- Map Data (Wilayas and Offices) ---
            logger.info("🗺️ Seeding wilayas and offices...")
            state_objects, office_objects = [], []

            for w in wilayas_data.get("wilayas", []):
                state_objects.append(
                    StateStats(
                        state_name=w["nom"],
                        state_number=int(w["code"]),
                        state_id=str(w["id"]),
                        state_alternative_name=w.get("nom", ""),
                        pre_arrived_dispatches_count=w["kpi"].get(
                            "Nombre de dépêches pré-arrivées", 0
                        ),
                        items_delivered=w["kpi"].get("Nombre denvois livrés", 0),
                        undelivered_items=w["kpi"].get("Nombre denvois non livrés ", 0),
                    )
                )
            StateStats.objects.bulk_create(state_objects)
            logger.info(f"✅ Created {len(state_objects)} StateStats records.")

            all_states = list(StateStats.objects.all())

            for state in all_states:
                office_names = offices_data.get(f"{int(state.state_number):02d}", [])
                for idx, office_name in enumerate(office_names):
                    office_objects.append(
                        OfficeStats(
                            office_name=office_name,
                            office_id=f"{state.state_number}-{idx + 1}",
                            office_alternative_name=office_name,
                            pre_arrived_dispatches_count=state.pre_arrived_dispatches_count,
                            items_delivered=state.items_delivered,
                            undelivered_items=state.undelivered_items,
                        )
                    )
            OfficeStats.objects.bulk_create(office_objects)
            logger.info(f"✅ Created {len(office_objects)} OfficeStats records.\n")

            logger.info("🎉 Database seeding complete!")
        except Exception as e:
            logger.exception("❌ Seeder encountered an error:")
            raise CommandError(f"Seeder failed: {e}")
