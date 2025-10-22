from core.models import Package
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = """Calculate KPIs based on the historic data"""

    def handle(self, *args, **kwargs):
        qs = Package.objects.all()
        total = qs.count()

        counts = qs.aggregate(
            success_count=Count("id", filter=Q(status="success")),
            failure_count=Count("id", filter=Q(status="failure")),
            in_process_count=Count("id", filter=Q(status="in_process")),
        )

        n_success = counts["success_count"]
        n_failure = counts["failure_count"]
        n_in_process = counts["in_process_count"]
        n_done = n_success + n_failure

        # On-time delivered packages
        on_time_count = qs.filter(
            status="success",
            total_duration__isnull=False,
            total_duration__lte=pd.Timedelta(days=SLA_DAYS),
        ).count()

        # Average & median delivery duration
        delivered_qs = qs.filter(status="success", total_duration__isnull=False)
        durations = delivered_qs.values_list("total_duration", flat=True)
        durations_filtered = [
            d
            for d in durations
            if pd.Timedelta(0) <= d <= pd.Timedelta(days=MAX_ALLOWED_DAYS)
        ]

        if durations_filtered:
            durations_series = pd.Series(durations_filtered)
            avg_duration_str = str(durations_series.mean())
            median_duration_str = str(durations_series.median())
        else:
            avg_duration_str = None
            median_duration_str = None
        Dashboard.object.create()

        return Response(
            {
                "total_packages": total,
                "success_count": n_success,
                "failure_count": n_failure,
                "in_process_count": n_in_process,
                "done_count": n_done,
                "success_rate_all": round(n_success / total, 4) if total else 0,
                "failure_rate_all": round(n_failure / total, 4) if total else 0,
                "success_rate_done": round(n_success / n_done, 4) if n_done else 0,
                "failure_rate_done": round(n_failure / n_done, 4) if n_done else 0,
                "on_time_delivery_rate_all": (
                    round(on_time_count / total, 4) if total else 0
                ),
                "on_time_delivery_rate_delivered_only": (
                    round(on_time_count / n_success, 4) if n_success else 0
                ),
                "average_delivery_duration": avg_duration_str,
                "median_delivery_duration": median_duration_str,
            },
            status=status.HTTP_200_OK,
        )
