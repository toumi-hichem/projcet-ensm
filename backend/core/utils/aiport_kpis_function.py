from datetime import timedelta
from django.db.models import (
    Count,
    Avg,
    F,
    ExpressionWrapper,
    DurationField,
    Q,
    Min,
    Max,
    Subquery,
    OuterRef,
)
from django.utils import timezone
from core.models import BagEvent, AirportStats


def compute_airport_stats(start_date=None, end_date=None):
    """
    Computes all airport KPIs based on BagEvent data between start_date and end_date,
    and saves a snapshot in AirportStats.

    Args:
        start_date (datetime, optional): Start of the date range (inclusive)
        end_date (datetime, optional): End of the date range (exclusive)
    """

    now = timezone.now()

    qs = BagEvent.objects.all()

    # 🕒 Apply date filtering if provided
    if start_date:
        qs = qs.filter(date__gte=start_date)
    if end_date:
        qs = qs.filter(date__lt=end_date)

    # -------------------------------
    # 📦 Counts & Lifecycle
    # -------------------------------
    bags_created_count = qs.filter(event_typecd="100").count()
    bags_closed_count = qs.filter(event_typecd="101").count()
    bags_reopened_count = qs.filter(event_typecd="102").count()
    bags_modified_count = qs.filter(event_typecd="105").count()
    bags_deleted_count = qs.filter(event_typecd="160").count()
    bags_sampled_count = qs.filter(event_typecd="178").count()

    # -------------------------------
    # 🌍 Domestic vs International
    # -------------------------------
    domestic_sent = qs.filter(event_typecd__in=["103", "132"]).count()
    domestic_received = qs.filter(event_typecd__in=["104", "133"]).count()
    international_sent = qs.filter(event_typecd__in=["106", "107"]).count()
    international_received = qs.filter(event_typecd__in=["130", "134", "135"]).count()

    international_vs_domestic_ratio = (
        international_sent + international_received
    ) / max(domestic_sent + domestic_received, 1)

    # -------------------------------
    # 🕓 Transit & Duration KPIs
    # -------------------------------
    first_event = (
        BagEvent.objects.filter(receptacle_fid=OuterRef("receptacle_fid"))
        .order_by("date")
        .values("date")[:1]
    )
    last_event = (
        BagEvent.objects.filter(receptacle_fid=OuterRef("receptacle_fid"))
        .order_by("-date")
        .values("date")[:1]
    )

    lifetimes = (
        qs.values("receptacle_fid")
        .annotate(
            first_date=Subquery(first_event),
            last_date=Subquery(last_event),
            duration=ExpressionWrapper(
                F("last_date") - F("first_date"), output_field=DurationField()
            ),
        )
        .values_list("duration", flat=True)
    )

    durations = [d for d in lifetimes if d is not None]
    avg_bag_lifecycle_time = (
        sum(durations, timedelta()) / len(durations) if durations else None
    )

    avg_duration_to_export = qs.filter(duration_to_next_step__isnull=False).aggregate(
        avg=Avg("duration_to_next_step")
    )["avg"]

    max_transit_duration = qs.aggregate(max=Max("total_duration"))["max"]
    avg_transit_duration_domestic = qs.filter(
        event_typecd__in=["103", "104", "132", "133"]
    ).aggregate(avg=Avg("duration_to_next_step"))["avg"]
    avg_transit_duration_international = qs.filter(
        event_typecd__in=["106", "107", "130", "134", "135"]
    ).aggregate(avg=Avg("duration_to_next_step"))["avg"]

    avg_handling_duration = qs.filter(duration_to_next_step__isnull=False).aggregate(
        avg=Avg("duration_to_next_step")
    )["avg"]

    # -------------------------------
    # ⚠️ Quality / Missing Data
    # -------------------------------
    total_events = qs.count() or 1
    bags_with_carrier_count = qs.filter(event_typecd="161").count()
    bags_with_missing_next_office = qs.filter(next_office__isnull=True).count()
    bags_with_missing_country = qs.filter(country__isnull=True).count()
    bags_in_customs_count = qs.filter(
        Q(country="DZ") & Q(next_office__isnull=True)
    ).count()

    # -------------------------------
    # ✅ Save snapshot
    # -------------------------------
    stats = AirportStats.objects.create(
        timestamp=now,
        bags_created_count=bags_created_count,
        bags_closed_count=bags_closed_count,
        bags_reopened_count=bags_reopened_count,
        bags_modified_count=bags_modified_count,
        bags_deleted_count=bags_deleted_count,
        bags_sampled_count=bags_sampled_count,
        domestic_bags_sent_count=domestic_sent,
        domestic_bags_received_count=domestic_received,
        international_bags_sent_count=international_sent,
        international_bags_received_count=international_received,
        international_vs_domestic_ratio=international_vs_domestic_ratio,
        avg_bag_lifecycle_time=avg_bag_lifecycle_time,
        avg_duration_to_export=avg_duration_to_export,
        avg_duration_to_delivery=None,  # optional: compute with more precise pair logic
        avg_transit_duration_domestic=avg_transit_duration_domestic,
        avg_transit_duration_international=avg_transit_duration_international,
        max_transit_duration=max_transit_duration,
        avg_handling_duration=avg_handling_duration,
        bags_with_carrier_count=bags_with_carrier_count,
        bags_with_missing_next_office=bags_with_missing_next_office,
        bags_with_missing_country=bags_with_missing_country,
        bags_in_customs_count=bags_in_customs_count,
    )

    return stats
