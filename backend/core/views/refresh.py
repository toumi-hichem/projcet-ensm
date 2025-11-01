import logging
from core.utils.aiport_kpis_function import compute_airport_stats
from core.utils.state_and_office_stats import compute_office_stats, compute_state_stats
from django.utils import timezone
import pandas as pd
from datetime import datetime
from django.db.models import Q, Count, Sum, Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import CPXStats, CTNIStats, Package, Dashboard

logger = logging.getLogger(__name__)
SLA_DAYS = 3
MAX_ALLOWED_DAYS = 60


class RefreshDashboard(APIView):
    """
    GET: Refresh and store current dashboard snapshot
    POST: Rebuild dashboard snapshot for a historical period (start_date → end_date)
    """

    def compute_hub_stats(self, hub_name, start_date=None, end_date=None):
        """
        Compute and store hub stats for CTNI or CPX.
        Optional start_date/end_date to compute for historical period.
        """
        try:
            logger.info(
                f"[{hub_name}] Computing hub stats. "
                f"Date range: {start_date} → {end_date}"
            )

            packages_qs = Package.objects.all()
            if start_date and end_date:
                packages_qs = packages_qs.filter(
                    last_event_timestamp__range=[start_date, end_date]
                )

            if hub_name == "CTNI":
                CTNIStats.compute_stats("CTNI", packages_queryset=packages_qs)
            elif hub_name == "ALGER COLIS POSTAUX":
                CPXStats.compute_stats(
                    "ALGER COLIS POSTAUX", packages_queryset=packages_qs
                )

            logger.info(f"[{hub_name}] Hub stats computation completed successfully.")
        except Exception as e:
            logger.exception(f"Error computing hub stats for {hub_name}: {e}")

    def get_queryset(self, start_date=None, end_date=None):
        """Return filtered queryset based on optional date range."""
        try:
            logger.info(f"Building queryset (start={start_date}, end={end_date})")
            qs = Package.objects.all()
            if start_date and end_date:
                qs = qs.filter(last_event_timestamp__range=[start_date, end_date])
            count = qs.count()
            logger.info(f"Queryset built successfully ({count} packages found).")
            return qs
        except Exception as e:
            logger.exception(f"Error building queryset: {e}")
            raise

    def calculate_kpis(self, qs):
        """Encapsulate all KPI calculations to reuse for GET/POST."""

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

        # ----------------------------
        # On-time deliveries
        # ----------------------------
        on_time_count = qs.filter(
            status="success",
            total_duration__isnull=False,
            total_duration__lte=pd.Timedelta(days=SLA_DAYS),
        ).count()

        # ----------------------------
        # Duration metrics
        # ----------------------------
        delivered_qs = qs.filter(status="success", total_duration__isnull=False)
        durations = delivered_qs.values_list("total_duration", flat=True)
        durations_filtered = [
            d
            for d in durations
            if pd.Timedelta(0) <= d <= pd.Timedelta(days=MAX_ALLOWED_DAYS)
        ]

        avg_duration_str = median_duration_str = None
        if durations_filtered:
            durations_series = pd.Series(durations_filtered)
            avg_duration_str = str(durations_series.mean())
            median_duration_str = str(durations_series.median())

        # ----------------------------
        # Recovery metrics
        # ----------------------------
        recovered_qs = qs.filter(recovered_after_failure=True)
        recovered_after_failure_count = recovered_qs.count()
        recovery_rate_success = (
            round(recovered_after_failure_count / n_success, 4) if n_success else 0
        )
        avg_failures_before_success = (
            round(
                recovered_qs.aggregate(
                    total_failures=Sum("failure_before_success_count")
                )["total_failures"]
                / recovered_after_failure_count,
                2,
            )
            if recovered_after_failure_count
            else 0
        )

        # ----------------------------
        # Post-failure movement
        # ----------------------------
        failed_qs = qs.filter(status="failure")
        failed_count = failed_qs.count()

        if failed_count:
            agg_data = failed_qs.aggregate(
                total_cities=Sum("cities_after_failure_count"),
                max_cities=Max("cities_after_failure_count"),
            )
            total_cities_after_failure = agg_data["total_cities"] or 0
            max_cities_after_failure = agg_data["max_cities"] or 0
            avg_cities_after_failure = (
                round(total_cities_after_failure / failed_count, 2)
                if failed_count
                else 0
            )

            packages_with_post_failure_movement = failed_qs.filter(
                cities_after_failure_count__gt=0
            ).count()
            pct_with_post_failure_movement = round(
                packages_with_post_failure_movement / failed_count, 4
            )
        else:
            total_cities_after_failure = 0
            max_cities_after_failure = 0
            avg_cities_after_failure = 0
            packages_with_post_failure_movement = 0
            pct_with_post_failure_movement = 0

        # ----------------------------
        # Customs (douane)
        # ----------------------------
        customs_in_qs = qs.filter(flag_seized=True)
        customs_out_qs = qs.filter(
            flag_seized=False, seized_at__isnull=False, exited_at__isnull=False
        )
        customs_alert_qs = qs.filter(alert_after_seizure=True)

        in_customs_count = customs_in_qs.count()
        exited_customs_count = customs_out_qs.count()
        customs_alert_count = customs_alert_qs.count()

        hold_durations = customs_out_qs.values_list("hold_duration", flat=True)
        valid_holds = [
            d for d in hold_durations if d is not None and d.total_seconds() > 0
        ]

        avg_hold_duration = median_hold_duration = None
        if valid_holds:
            avg_hold_duration = str(pd.Series(valid_holds).mean())
            median_hold_duration = str(pd.Series(valid_holds).median())

        return {
            "total_packages": total,
            "success_count": n_success,
            "failure_count": n_failure,
            "in_process_count": n_in_process,
            "done_count": n_done,
            "success_rate_all": round(n_success / total, 4) if total else 0,
            "failure_rate_all": round(n_failure / total, 4) if total else 0,
            "success_rate_done": round(n_success / n_done, 4) if n_done else 0,
            "failure_rate_done": round(n_failure / n_done, 4) if n_done else 0,
            "on_time_delivery_rate_all": round(on_time_count / total, 4)
            if total
            else 0,
            "on_time_delivery_rate_delivered_only": round(on_time_count / n_success, 4)
            if n_success
            else 0,
            "average_delivery_duration": avg_duration_str,
            "median_delivery_duration": median_duration_str,
            "recovered_after_failure_count": recovered_after_failure_count,
            "recovery_rate_success": recovery_rate_success,
            "avg_failures_before_success": avg_failures_before_success,
            "in_customs_count": in_customs_count,
            "exited_customs_count": exited_customs_count,
            "customs_alert_count": customs_alert_count,
            "avg_customs_hold_duration": avg_hold_duration,
            "median_customs_hold_duration": median_hold_duration,
            "total_cities_after_failure": total_cities_after_failure,
            "avg_cities_after_failure": avg_cities_after_failure,
            "max_cities_after_failure": max_cities_after_failure,
            "packages_with_post_failure_movement": packages_with_post_failure_movement,
            "pct_with_post_failure_movement": pct_with_post_failure_movement,
        }

    def save_to_dashboard(self, data, snapshot_time):
        """Store snapshot in Dashboard model."""
        if timezone.is_naive(snapshot_time):
            snapshot_time = timezone.make_aware(snapshot_time)

        print("saving dashboard with this end-date: ", snapshot_time)
        Dashboard.objects.create(
            pre_arrived_dispatches_count=0,
            items_delivered=data["success_count"],
            items_delivered_after_one_fail=data["recovered_after_failure_count"],
            undelivered_items=data["failure_count"],
            delivery_rate=data["success_rate_all"] * 100,
            on_time_delivery_rate=data["on_time_delivery_rate_all"] * 100,
            items_exceeding_holding_time=0,
            items_blocked_in_customs=data["in_customs_count"],
            returned_items=0,
            consolidation_time=str(data["avg_failures_before_success"]),
            end_to_end_transit_time_average=data["average_delivery_duration"] or "",
            shipment_consolidation_time=data["avg_customs_hold_duration"] or "",
            unscanned_items=0,
            timestamp=snapshot_time,
        )

    def get(self, request, *args, **kwargs):
        """Refresh current snapshot using latest events."""
        logger.debug("Refreshing KPIs...")
        now = datetime.now()
        qs = self.get_queryset()
        data = self.calculate_kpis(qs)

        logger.debug("Dashboard kpis...")
        self.save_to_dashboard(data, now)

        logger.debug("Office kpis...")
        compute_office_stats()
        logger.debug("State kpis...")
        compute_state_stats()
        logger.debug("Airport kpis...")
        compute_airport_stats()
        logger.debug("CTNI kpis...")
        self.compute_hub_stats("CTNI")
        logger.debug("CPX kpis...")
        self.compute_hub_stats("ALGER COLIS POSTAUX")
        return Response(
            {"status": "ok", "timestamp": now.isoformat()}, status=status.HTTP_200_OK
        )

    def post(self, request, *args, **kwargs):
        """Rebuild snapshot for a given period (using last_event_timestamp range)."""

        start_date_str = request.data.get("start_date")
        end_date_str = request.data.get("end_date")
        logger.info(f"Refreshing kpis between {start_date_str} - {end_date_str}")
        if not start_date_str or not end_date_str:
            logger.error("start_date and end_date are required")
            return Response(
                {"error": "start_date and end_date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Parse ISO8601 strings to datetime
            start_date = datetime.fromisoformat(start_date_str)
            end_date = datetime.fromisoformat(end_date_str)

            # Only make aware if they're naive
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date)
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date)

        except Exception as e:
            logger.error(f"Invalid date format: {str(e)}")
            return Response(
                {"error": f"Invalid date format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset(start_date, end_date)
        data = self.calculate_kpis(qs)

        # Ensure snapshot_time is aware and has correct time
        snapshot_time = end_date.replace(hour=23, minute=59, second=59, microsecond=0)
        if timezone.is_naive(snapshot_time):
            snapshot_time = timezone.make_aware(snapshot_time)
        logger.debug("Dashboard kpis...")
        self.save_to_dashboard(data, snapshot_time)
        logger.debug("Office kpis...")
        compute_office_stats(start_date, end_date)
        logger.debug("State kpis...")
        compute_state_stats(start_date, end_date)
        logger.debug("Airport kpis...")
        compute_airport_stats(start_date, end_date)

        logger.debug("CTNI kpis...")
        self.compute_hub_stats("CTNI", start_date, end_date)
        logger.debug("CPX kpis...")
        self.compute_hub_stats("ALGER COLIS POSTAUX", start_date, end_date)
        logger.debug("KPIs completed.")

        return Response(
            {"status": "ok", "timestamp": snapshot_time.isoformat()},
            status=status.HTTP_200_OK,
        )
