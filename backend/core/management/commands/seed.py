import json
import random
import logging
from datetime import timedelta
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from core.models import (
    Dashboard,
    KPIHistory,
    CTNIStats,
    CPXStats,
    AirportStats,
    Alert,
    StateStats,
    OfficeStats,
)

logger = logging.getLogger(__name__)


# python manage.py seed --wilayas "core/data/wilayadata.json" --offices "core/data/wilaya_post_offices.json"
class Command(BaseCommand):
    help = "Seeds database with KPIs, alerts, and map data"

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
                Dashboard,
                CTNIStats,
                CPXStats,
                AirportStats,
                KPIHistory,
                Alert,
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

            # --- Create main KPI models ---
            logger.info("📊 Creating dashboard and major center KPI records...")
            dashboard = Dashboard.objects.create(
                pre_arrived_dispatches_count=-1,
                items_delivered=-1,
                items_delivered_after_one_fail=-1,
                undelivered_items=-1,
                delivery_rate=-0.1,
                on_time_delivery_rate=-0.1,
                items_blocked_in_customs=-1,
                returned_items=-1,
                consolidation_time="P1D",
                end_to_end_transit_time_average="P1D",
                shipment_consolidation_time="P1D",
                unscanned_items=-1,
                items_exceeding_holding_time=-1,
            )

            ctni = CTNIStats.objects.create(
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

            cpx = CPXStats.objects.create(
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

            airport = AirportStats.objects.create(
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

            # --- Generate KPI History ---
            now = timezone.now()
            start_date = now - timedelta(days=365)

            logger.info("📈 Generating KPI history for one year...")
            kpis = [
                # Dashboard
                "pre_arrived_dispatches_count",
                "items_delivered",
                "items_delivered_after_one_fail",
                "undelivered_items",
                "delivery_rate",
                "on_time_delivery_rate",
                "items_exceeding_holding_time",
                "items_blocked_in_customs",
                "returned_items",
                "consolidation_time",
                "end_to_end_transit_time_average",
                "shipment_consolidation_time",
                "unscanned_items",
                # CTNI
                "ctni_pre_arrived_dispatches_count",
                "ctni_items_delivered",
                "ctni_items_delivered_after_one_fail",
                "ctni_undelivered_items",
                "ctni_delivery_rate",
                "ctni_on_time_delivery_rate",
                "ctni_items_exceeding_holding_time",
                "ctni_items_blocked_in_customs",
                "ctni_returned_items",
                "ctni_consolidation_time",
                "ctni_end_to_end_transit_time_average",
                "ctni_shipment_consolidation_time",
                "ctni_unscanned_items",
                # CPX
                "cpx_pre_arrived_dispatches_count",
                "cpx_items_delivered",
                "cpx_items_delivered_after_one_fail",
                "cpx_undelivered_items",
                "cpx_delivery_rate",
                "cpx_on_time_delivery_rate",
                "cpx_items_exceeding_holding_time",
                "cpx_items_blocked_in_customs",
                "cpx_returned_items",
                "cpx_consolidation_time",
                "cpx_end_to_end_transit_time_average",
                "cpx_shipment_consolidation_time",
                "cpx_unscanned_items",
                # Airport
                "airport_pre_arrived_dispatches_count",
                "airport_items_delivered",
                "airport_items_delivered_after_one_fail",
                "airport_undelivered_items",
                "airport_delivery_rate",
                "airport_on_time_delivery_rate",
                "airport_items_exceeding_holding_time",
                "airport_items_blocked_in_customs",
                "airport_returned_items",
                "airport_consolidation_time",
                "airport_end_to_end_transit_time_average",
                "airport_shipment_consolidation_time",
                "airport_unscanned_items",
            ]

            base_values = {kpi: random.uniform(50, 250) for kpi in kpis}
            entries = []
            current = start_date

            while current <= now:
                for kpi in kpis:
                    base = base_values[kpi]
                    if "rate" in kpi:
                        value = max(75.0, min(100.0, random.gauss(base % 100, 3)))
                    elif "time" in kpi:
                        value = round(base / 100 + random.uniform(-0.3, 0.3), 2)
                    else:
                        value = round(base + random.uniform(-10, 10), 2)
                    entries.append(
                        KPIHistory(kpi_name=kpi, timestamp=current, value=value)
                    )
                current += timedelta(days=1)

            KPIHistory.objects.bulk_create(entries, ignore_conflicts=True)
            logger.info(f"✅ Created {len(entries)} KPIHistory entries.\n")

            # --- Map Data ---
            logger.info("🗺️ Seeding wilayas and offices...")
            state_objects, office_objects = [], []

            for w in wilayas_data.get("wilayas", []):
                state_objects.append(
                    StateStats(
                        state_name=w["nom"],
                        state_number=int(w["code"]),
                        state_id=str(w["id"]),
                        state_alternative_name=w.get("nom", ""),
                        pre_arrived_dispatches_count=w["kpi"][
                            "Nombre de dépêches pré-arrivées"
                        ],
                        items_delivered=w["kpi"]["Nombre denvois livrés"],
                        undelivered_items=w["kpi"]["Nombre denvois non livrés "],
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

            # --- Create random alerts for each state ---
            logger.info("🚨 Generating random alerts for each state...")
            all_states = list(StateStats.objects.all())
            alert_types = list(Alert.AlarmType.values)

            all_alerts = []
            for state in all_states:
                for _ in range(random.randint(1, 5)):  # 1–5 alerts per state
                    code = random.choice(alert_types)
                    all_alerts.append(
                        Alert(
                            alarm_code=code,
                            title=dict(Alert.AlarmType.choices).get(
                                code, "Unknown Alert"
                            ),
                            trigger_condition="Condition simulée.",
                            severity=random.choice(["Faible", "Moyenne", "Urgente"]),
                            action_required="Action automatique simulée.",
                            state=state,
                            acknowledged=random.choice([True, False]),
                            timestamp=timezone.now()
                            - timedelta(hours=random.randint(1, 72)),
                        )
                    )

            Alert.objects.bulk_create(all_alerts)
            logger.info(
                f"✅ Created {len(all_alerts)} alerts across {len(all_states)} states.\n"
            )

            logger.info("🎉 Database seeding complete!")
        except Exception as e:
            logger.exception("❌ Seeder encountered an error:")
            raise CommandError(f"Seeder failed: {e}")
