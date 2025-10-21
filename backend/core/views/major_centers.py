from calendar import c
from datetime import datetime
import logging

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Avg
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from core.models import AirportStats, CPXStats, CTNIStats
from core.serializers import (
    AirportStatsSerializer,
    CPXStatsSerializer,
    CTNIStatsSerializer,
)

logger = logging.getLogger(__name__)


class MajorCentersAPIView(APIView):
    """
    Returns KPIs and alerts about Major Centers: CTNI, CPX, Airport
    """

    def get(self, request, centerID):
        try:
            if centerID == "ctni":
                obj = CTNIStats.objects.latest("timestamp")
                serializer = CTNIStatsSerializer(obj)
                logger.info("Fetched latest CTNI stats successfully.")
                return Response({"success": True, "data": {"ctni": serializer.data}})

            elif centerID == "cpx":
                obj = CPXStats.objects.latest("timestamp")
                serializer = CPXStatsSerializer(obj)
                logger.info("Fetched latest CPX stats successfully.")
                return Response({"success": True, "data": {"cpx": serializer.data}})

            elif centerID == "airport":
                obj = AirportStats.objects.latest("timestamp")
                serializer = AirportStatsSerializer(obj)
                logger.info("Fetched latest Airport stats successfully.")
                return Response({"success": True, "data": {"airport": serializer.data}})

            elif centerID == "all":
                ctni = CTNIStatsSerializer(CTNIStats.objects.latest("timestamp")).data
                cpx = CPXStatsSerializer(CPXStats.objects.latest("timestamp")).data
                airport = AirportStatsSerializer(
                    AirportStats.objects.latest("timestamp")
                ).data
                logger.info("Fetched all major center stats successfully.")
                return Response(
                    {
                        "success": True,
                        "data": {"ctni": ctni, "cpx": cpx, "airport": airport},
                    }
                )

            else:
                logger.warning(f"Invalid centerID received: {centerID}")
                return Response(
                    {
                        "success": False,
                        "message": "Invalid centerID. Choose one of: ctni, cpx, airport, all.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except ObjectDoesNotExist:
            logger.error(f"No data found for centerID: {centerID}")
            return Response(
                {"success": False, "message": f"No data found for {centerID}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:
            logger.exception(
                f"Unexpected error while fetching stats for {centerID}: {e}"
            )
            return Response(
                {"success": False, "message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ─────────────────────────────────────────────
    # 📊 POST: Historical KPI Aggregation
    # ─────────────────────────────────────────────
    def post(self, request, centerID):
        kpi_field_name = request.data.get("kpi_field_name")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")
        interval = request.data.get("interval", "daily")
        logger.debug(f"post request with the following data: {request.data}")
        # Validate payload
        missing = [
            f
            for f in ["kpi_field_name", "start_date", "end_date"]
            if not request.data.get(f)
        ]
        if missing:
            logger.error(f"Missing body fields: {missing}")
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Missing fields: {', '.join(missing)}. "
                        "Expected payload: { kpi_field_name, start_date, end_date, interval? }"
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse dates
        try:
            start_date = datetime.fromisoformat(start_date)
            end_date = datetime.fromisoformat(end_date)
        except ValueError:
            logger.error(
                f"Incorrect date format for start or end dates: start_date:{start_date}, end_date: {end_date}"
            )
            return Response(
                {"success": False, "message": "Invalid date format. Use ISO 8601."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Choose model
        model_map = {
            "ctni": CTNIStats,
            "cpx": CPXStats,
            "airport": AirportStats,
        }
        Model = model_map.get(centerID)
        if not Model:
            logger.error(
                f"Incorrect centerID, you: {centerID}. Available options: ctni, cpx, airport"
            )
            return Response(
                {
                    "success": False,
                    "message": "Invalid centerID. Choose one of: ctni, cpx, airport.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check KPI field
        if not hasattr(Model, kpi_field_name):
            logger.error(f"Non-existant field name: {kpi_field_name}")
            return Response(
                {"success": False, "message": f"Invalid KPI field '{kpi_field_name}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate interval
        valid_intervals = ["daily", "weekly", "monthly"]
        if interval not in valid_intervals:
            logger.error(
                f"invalid interval, you: {interval}, available options: daily, weekly, monthly"
            )
            return Response(
                {
                    "success": False,
                    "message": f"Invalid interval '{interval}'. Must be one of {valid_intervals}.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        trunc_map = {
            "daily": TruncDay("timestamp"),
            "weekly": TruncWeek("timestamp"),
            "monthly": TruncMonth("timestamp"),
        }
        trunc_func = trunc_map[interval]

        # Query aggregation
        queryset = (
            Model.objects.filter(timestamp__range=(start_date, end_date))
            .annotate(period=trunc_func)
            .values("period")
            .annotate(avg_value=Avg(kpi_field_name))
            .order_by("period")
        )

        if not queryset.exists():
            return Response(
                {
                    "success": False,
                    "message": f"No data found for '{kpi_field_name}' in that range.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Format name for the period
        def format_name(dt: datetime, interval: str) -> str:
            if interval == "monthly":
                return dt.strftime("%B")
            elif interval == "weekly":
                return f"Week {dt.isocalendar().week}"
            else:
                return dt.strftime("%d/%m")

        data = [
            {
                "timestamp": item["period"].isoformat(),
                "value": item["avg_value"],
                "kpi_name": kpi_field_name,
                "name": format_name(item["period"], interval),
            }
            for item in queryset
        ]

        return Response(
            {
                "success": True,
                "center": centerID,
                "kpi": kpi_field_name,
                "interval": interval,
                "start_date": start_date,
                "end_date": end_date,
                "data": data,
            }
        )
