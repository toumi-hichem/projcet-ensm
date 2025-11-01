from datetime import timedelta
from django.db.models import Count, Avg, Q
from core.models import (
    State,
    StateStats,
    Package,
    PackageEvent,
    PostalOffice,
    OfficeStats,
)


def compute_office_stats(start_date=None, end_date=None):
    """Compute Office KPIs (optionally within a date range)."""
    date_filter = Q()
    if start_date and end_date:
        date_filter &= Q(date__range=[start_date, end_date])

    for office in PostalOffice.objects.all():
        event_qs = PackageEvent.objects.filter(office=office).filter(date_filter)
        package_ids = event_qs.values_list("package_id", flat=True).distinct()
        packages = Package.objects.filter(id__in=package_ids)
        avg_delivery = packages.filter(status="success").aggregate(
            avg=Avg("total_duration")
        )["avg"]
        avg_hold = packages.aggregate(avg=Avg("hold_duration"))["avg"]

        OfficeStats.objects.update_or_create(
            office=office,
            defaults={
                "pre_arrived_dispatches_count": event_qs.filter(
                    event_type_cd__icontains="PRE_ARRIVED"
                ).count(),
                "items_delivered": packages.filter(status="success").count(),
                "undelivered_items": packages.filter(status="failure").count(),
                "total_packages": packages.count(),
                "avg_delivery_duration": avg_delivery
                if avg_delivery
                else timedelta(seconds=0),
                "avg_hold_duration": avg_hold if avg_hold else timedelta(seconds=0),
                "seized_packages": packages.filter(flag_seized=True).count(),
                "recovered_after_failure_count": packages.filter(
                    recovered_after_failure=True
                ).count(),
                "alert_after_success_count": packages.filter(
                    alert_after_success=True
                ).count(),
                "failure_before_success_count": packages.aggregate(
                    total=Avg("failure_before_success_count")
                )["total"]
                or 0,
                "cities_after_failure_avg": packages.aggregate(
                    avg=Avg("cities_after_failure_count")
                )["avg"]
                or 0,
            },
        )


def compute_state_stats(start_date=None, end_date=None):
    """Compute State KPIs (optionally within a date range)."""
    date_filter = Q()
    if start_date and end_date:
        date_filter &= Q(date__range=[start_date, end_date])

    for state in State.objects.all():
        event_qs = PackageEvent.objects.filter(state=state).filter(date_filter)
        package_ids = event_qs.values_list("package_id", flat=True).distinct()
        packages = Package.objects.filter(id__in=package_ids)
        avg_delivery = packages.filter(status="success").aggregate(
            avg=Avg("total_duration")
        )["avg"]
        avg_hold = packages.aggregate(avg=Avg("hold_duration"))["avg"]

        StateStats.objects.update_or_create(
            state=state,
            defaults={
                "pre_arrived_dispatches_count": event_qs.filter(
                    event_type_cd__icontains="PRE_ARRIVED"
                ).count(),
                "items_delivered": packages.filter(status="success").count(),
                "undelivered_items": packages.filter(status="failure").count(),
                "total_packages": packages.count(),
                "avg_delivery_duration": avg_delivery
                if avg_delivery
                else timedelta(seconds=0),
                "avg_hold_duration": avg_hold if avg_hold else timedelta(seconds=0),
                "seized_packages": packages.filter(flag_seized=True).count(),
                "recovered_after_failure_count": packages.filter(
                    recovered_after_failure=True
                ).count(),
                "alert_after_success_count": packages.filter(
                    alert_after_success=True
                ).count(),
                "failure_before_success_count": packages.aggregate(
                    total=Avg("failure_before_success_count")
                )["total"]
                or 0,
                "cities_after_failure_avg": packages.aggregate(
                    avg=Avg("cities_after_failure_count")
                )["avg"]
                or 0,
            },
        )
