from django.db.models import Max
from core.models import Dashboard, KPIHistory
# from datetime import timedelta


def populate_daily_kpi_history():
    kpi_fields = [
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
    ]

    # Step 1: find the latest Dashboard snapshot per day
    dashboards_by_day = (
        Dashboard.objects.extra(select={"day": "DATE(timestamp)"})
        .values("day")
        .annotate(latest_ts=Max("timestamp"))
        .order_by("day")
    )

    # Step 2: Fetch those exact latest snapshots
    latest_per_day = Dashboard.objects.filter(
        timestamp__in=[d["latest_ts"] for d in dashboards_by_day]
    ).order_by("timestamp")

    # Step 3: Build KPIHistory entries
    history_records = []

    for d in latest_per_day:
        for field in kpi_fields:
            value = getattr(d, field)
            history_records.append(
                KPIHistory(
                    kpi_name=field,
                    timestamp=d.timestamp,
                    value=value,
                )
            )

    # Step 4: Bulk insert, skipping duplicates
    KPIHistory.objects.bulk_create(history_records, ignore_conflicts=True)

    print(f"✅ Added {len(history_records)} daily KPI points.")
