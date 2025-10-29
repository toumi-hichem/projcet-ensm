from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from dateutil.relativedelta import relativedelta
import requests
import time


class RebuildSnapshotsAPIView(APIView):
    """
    POST /api/rebuild_snapshots/

    Body JSON:
    {
        "start": "2023-01-01",
        "end": "2023-06-01",
        "url": "http://localhost:8000/refresh/",
        "sleep": 3
    }
    """

    def post(self, request):
        start_str = request.data.get("start")
        end_str = request.data.get("end")
        url = request.data.get("url")
        sleep_time = int(request.data.get("sleep", 3))

        # Validate input
        if not (start_str and end_str and url):
            return Response(
                {"error": "Missing required fields: start, end, or url."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start_date = datetime.strptime(start_str, "%Y-%m-%d")
            end_date = datetime.strptime(end_str, "%Y-%m-%d")
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current = start_date
        total_snapshots = 0
        results = []

        while current <= end_date:
            month_start = current.replace(day=1)
            month_end = (current + relativedelta(day=31)).replace(
                hour=23, minute=59, second=59
            )
            snapshot_date = month_end if month_end <= end_date else end_date

            payload = {
                "start_date": month_start.strftime("%Y-%m-%dT00:00:00"),
                "end_date": snapshot_date.strftime("%Y-%m-%dT23:59:59"),
            }

            success = False
            attempts = 0
            error_message = None

            while not success and attempts < 5:
                try:
                    resp = requests.post(url, json=payload, timeout=60)
                    resp.raise_for_status()
                    success = True
                    total_snapshots += 1
                    results.append(
                        {
                            "month": snapshot_date.strftime("%Y-%m"),
                            "status": "success",
                            "code": resp.status_code,
                        }
                    )
                except requests.exceptions.RequestException as e:
                    attempts += 1
                    error_message = str(e)
                    if attempts < 5:
                        time.sleep(sleep_time)
                    else:
                        results.append(
                            {
                                "month": snapshot_date.strftime("%Y-%m"),
                                "status": "failed",
                                "error": error_message,
                            }
                        )

            if success:
                time.sleep(sleep_time)

            current += relativedelta(months=1)

        return Response(
            {
                "message": "Rebuild complete.",
                "total_snapshots": total_snapshots,
                "details": results,
            },
            status=status.HTTP_200_OK,
        )
