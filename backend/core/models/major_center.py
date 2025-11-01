from core.models.bag import Bag
from core.models.package import Package, PackageEvent
from django.db import models
from django.utils import timezone
from django.db.models import F, Avg, Count, Q, Max
import pandas as pd


class HubStatsBase(models.Model):
    """
    Base model for hub/concentration center stats (CTNI / CPX)
    """

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # -------------------------------
    # 📦 Volumes
    # -------------------------------
    incoming_bags_count = models.IntegerField(default=0)
    outgoing_bags_count = models.IntegerField(default=0)  # ✅ added
    delayed_arrivals_count = models.IntegerField(default=0)  # ✅ added
    unprocessed_items_count = models.IntegerField(default=0)

    # -------------------------------
    # ⚡ Efficiency / Throughput
    # -------------------------------
    avg_sorting_time = models.DurationField(null=True, blank=True)
    max_sorting_time = models.DurationField(null=True, blank=True)
    throughput_rate = models.FloatField(default=0.0)  # items/hour
    avg_items_per_bag = models.FloatField(default=0.0)  # ✅ added

    # -------------------------------
    # ⚠️ Exceptions / Traceability
    # -------------------------------
    unscanned_items_count = models.IntegerField(default=0)
    misrouted_items_count = models.IntegerField(default=0)  # ✅ added
    damaged_items_count = models.IntegerField(default=0)  # ✅ added
    alerts_triggered_count = models.IntegerField(default=0)
    seized_items_count = models.IntegerField(default=0)

    # -------------------------------
    # ⏱️ Transit / Timing
    # -------------------------------
    avg_holding_time = models.DurationField(null=True, blank=True)
    median_holding_time = models.DurationField(null=True, blank=True)
    items_exceeding_holding_time = models.IntegerField(default=0)

    class Meta:
        abstract = True

    def __str__(self):
        return f"Hub snapshot at {self.timestamp:%Y-%m-%d %H:%M}"

    @classmethod
    def compute_stats(
        cls,
        hub_name=None,
        packages_queryset=None,
        events_queryset=None,
        bag_queryset=None,
    ):
        """
        Compute hub stats given filtered Package and PackageEvent querysets.
        `hub_name` is now only for logging.
        """

        # Use provided querysets or default to all
        packages = packages_queryset or Package.objects.all()
        events = events_queryset or PackageEvent.objects.all()
        bags = bag_queryset or Bag.objects.all()

        # -------------------------------
        # Volumes
        # -------------------------------

        # Count all bags that have at least one package
        incoming_bags_count = bags.filter(packages__isnull=False).distinct().count()

        # Outgoing bags: any bag that has a DISPATCHED event
        outgoing_bags_count = (
            bags.filter(packages__events__event_type_cd__icontains="DISPATCHED")
            .distinct()
            .count()
        )

        # Delayed arrivals: any event with type ARRIVAL where date > expected_arrival
        delayed_arrivals_count = events.filter(
            event_type_cd__icontains="ARRIVAL",
        ).count()

        # Unprocessed items: packages with no events
        unprocessed_items_count = packages.filter(events__isnull=True).count()

        # -------------------------------
        # Efficiency / Throughput
        # -------------------------------

        # Sorting time per bag = time between first ARRIVAL and last DISPATCHED
        sorting_times = []
        for bag in bags.filter(packages__isnull=False).distinct():
            bag_events = PackageEvent.objects.filter(
                package__in=bag.packages.all(),
                event_type_cd__in=["ARRIVAL", "DISPATCHED"],
            ).order_by("date")
            first_arrival = bag_events.filter(event_type_cd="ARRIVAL").first()
            last_dispatch = bag_events.filter(event_type_cd="DISPATCHED").last()
            if first_arrival and last_dispatch:
                sorting_times.append(last_dispatch.date - first_arrival.date)

        if sorting_times:
            durations_series = pd.Series(sorting_times)
            avg_sorting_time = durations_series.mean()
            max_sorting_time = durations_series.max()
            throughput_rate = packages.count() / max(
                1, sum([t.total_seconds() for t in sorting_times]) / 3600
            )
        else:
            avg_sorting_time = max_sorting_time = None
            throughput_rate = 0

        avg_items_per_bag = (
            packages.count() / incoming_bags_count if incoming_bags_count else 0
        )

        # -------------------------------
        # Exceptions / Traceability
        # -------------------------------
        unscanned_items_count = packages.filter(events__isnull=True).count()
        misrouted_items_count = packages.filter(
            events__next_office__isnull=True
        ).count()
        damaged_items_count = (
            getattr(packages.model, "flag_damaged", False)
            and packages.filter(flag_damaged=True).count()
            or 0
        )
        alerts_triggered_count = packages.filter(alert_after_success=True).count()
        seized_items_count = packages.filter(flag_seized=True).count()

        # -------------------------------
        # Transit / Holding
        # -------------------------------
        holding_durations = packages.filter(hold_duration__isnull=False).values_list(
            "hold_duration", flat=True
        )
        if holding_durations:
            durations_series = pd.Series(holding_durations)
            avg_holding_time = durations_series.mean()
            median_holding_time = durations_series.median()
            items_exceeding_holding_time = packages.filter(
                hold_duration__gt=pd.Timedelta(hours=24)
            ).count()
        else:
            avg_holding_time = median_holding_time = None
            items_exceeding_holding_time = 0

        # -------------------------------
        # Save snapshot
        # -------------------------------
        return cls.objects.create(
            incoming_bags_count=incoming_bags_count,
            outgoing_bags_count=outgoing_bags_count,
            delayed_arrivals_count=delayed_arrivals_count,
            unprocessed_items_count=unprocessed_items_count,
            avg_sorting_time=avg_sorting_time,
            max_sorting_time=max_sorting_time,
            throughput_rate=throughput_rate,
            avg_items_per_bag=avg_items_per_bag,
            unscanned_items_count=unscanned_items_count,
            misrouted_items_count=misrouted_items_count,
            damaged_items_count=damaged_items_count,
            alerts_triggered_count=alerts_triggered_count,
            seized_items_count=seized_items_count,
            avg_holding_time=avg_holding_time,
            median_holding_time=median_holding_time,
            items_exceeding_holding_time=items_exceeding_holding_time,
        )


# -------------------------------
# Concrete models
# -------------------------------
class CTNIStats(HubStatsBase):
    pass


class CPXStats(HubStatsBase):
    pass


class AirportStats(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # -------------------------------
    # 📦 Lifecycle & Volume
    # -------------------------------
    bags_created_count = models.IntegerField(default=0)
    bags_closed_count = models.IntegerField(default=0)
    bags_reopened_count = models.IntegerField(default=0)
    bags_deleted_count = models.IntegerField(default=0)
    bags_modified_count = models.IntegerField(default=0)

    # -------------------------------
    # 🌍 Domestic / International Flow
    # -------------------------------
    domestic_bags_sent_count = models.IntegerField(default=0)
    domestic_bags_received_count = models.IntegerField(default=0)
    international_bags_sent_count = models.IntegerField(default=0)
    international_bags_received_count = models.IntegerField(default=0)
    international_vs_domestic_ratio = models.FloatField(default=0.0)

    # -------------------------------
    # 🕓 Timing & Performance
    # -------------------------------
    avg_bag_lifecycle_time = models.DurationField(null=True, blank=True)
    avg_duration_to_export = models.DurationField(null=True, blank=True)
    avg_duration_to_delivery = models.DurationField(null=True, blank=True)
    avg_transit_duration_domestic = models.DurationField(null=True, blank=True)
    avg_transit_duration_international = models.DurationField(null=True, blank=True)
    max_transit_duration = models.DurationField(null=True, blank=True)
    avg_handling_duration = models.DurationField(null=True, blank=True)

    # -------------------------------
    # ⚠️ Quality & Exceptions
    # -------------------------------
    bags_sampled_count = models.IntegerField(default=0)
    bags_with_carrier_count = models.IntegerField(default=0)
    bags_with_missing_next_office = models.IntegerField(default=0)
    bags_with_missing_country = models.IntegerField(default=0)
    bags_in_customs_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Airport stats @ {self.timestamp:%Y-%m-%d %H:%M}"
