import logging
from datetime import datetime
from django.db.models import Avg
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import Dashboard
from core.serializers.dashboard import DashboardSerializer

logger = logging.getLogger(__name__)


class DashboardApiView(APIView):
    def get(self, request):
        try:
            dashboard = Dashboard.objects.latest("timestamp")
            serializer = DashboardSerializer(dashboard)
            return Response({"success": True, "data": serializer.data})
        except Dashboard.DoesNotExist:
            logger.error("No dashboard data available.")
            return Response(
                {
                    "success": False,
                    "message": "No dashboard data available. Please refresh",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

    def post(self, request):
        kpi_field_name = request.data.get("kpi_field_name")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")
        interval = request.data.get("interval", "daily")  # default to daily

        # --- Validate required fields ---
        missing_fields = [
            field
            for field in ["kpi_field_name", "start_date", "end_date"]
            if not request.data.get(field)
        ]
        if missing_fields:
            logger.error(
                f"[POST:dashboard/] Missing fields: {', '.join(missing_fields)}"
            )
            return Response(
                {
                    "success": False,
                    "message": (
                        "Missing fields. Expected payload: "
                        "{ kpi_field_name: str, start_date: ISODate, end_date: ISODate, interval?: daily|weekly|monthly }"
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Parse date range ---
        try:
            start_date = datetime.fromisoformat(start_date)
            end_date = datetime.fromisoformat(end_date)
        except ValueError:
            logger.error(f"Invalid date format in POST: {start_date} / {end_date}")
            return Response(
                {"success": False, "message": "Invalid date format. Use ISO 8601."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Validate KPI field ---
        from core.models import Dashboard, KPIHistory

        if not hasattr(Dashboard, kpi_field_name):
            logger.warning(f"Invalid KPI field requested: {kpi_field_name}")
            return Response(
                {"success": False, "message": f"Invalid KPI field '{kpi_field_name}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Validate interval ---
        valid_intervals = ["daily", "weekly", "monthly"]
        if interval not in valid_intervals:
            logger.warning(f"Invalid interval: {interval}")
            return Response(
                {
                    "success": False,
                    "message": f"Invalid interval '{interval}'. Must be one of {valid_intervals}.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Choose aggregation function ---
        trunc_map = {
            "daily": TruncDay("timestamp"),
            "weekly": TruncWeek("timestamp"),
            "monthly": TruncMonth("timestamp"),
        }
        trunc_func = trunc_map[interval]

        # --- Query and group by interval ---
        queryset = (
            KPIHistory.objects.filter(
                kpi_name=kpi_field_name,
                timestamp__range=(start_date, end_date),
            )
            .annotate(period=trunc_func)
            .values("period")
            .annotate(avg_value=Avg("value"))
            .order_by("period")
        )

        if not queryset.exists():
            logger.info(f"No KPI history found for {kpi_field_name} in given range.")
            return Response(
                {
                    "success": False,
                    "message": f"No data found for '{kpi_field_name}' in that date range.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --- Helper: format "name" field depending on interval ---
        def format_name(dt: datetime, interval: str) -> str:
            if interval == "monthly":
                return dt.strftime("%B")  # e.g., "October"
            elif interval == "weekly":
                return f"Week {dt.isocalendar().week}"
            else:  # daily
                return dt.strftime("%d/%m")

        # --- Format results ---
        data = []
        for item in queryset:
            period: datetime = item["period"]
            data.append(
                {
                    "timestamp": period.isoformat(),
                    "value": item["avg_value"],
                    "kpi_name": kpi_field_name,
                    "name": format_name(period, interval),
                }
            )

        return Response(
            {
                "success": True,
                "kpi": kpi_field_name,
                "interval": interval,
                "start_date": start_date,
                "end_date": end_date,
                "data": data,
            }
        )
