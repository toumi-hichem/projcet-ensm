import logging
from django.http import JsonResponse
from django.views import View
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from core.models import Alert
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class AcknowledgeAlertView(APIView):
    """
    POST /api/alerts/<int:alert_id>/acknowledge/

    Marks an alert as acknowledged.
    """

    def post(self, request, alert_id):
        try:
            logger.info(f"Received acknowledge request for Alert ID: {alert_id}")

            with transaction.atomic():
                try:
                    alert = Alert.objects.select_for_update().get(pk=alert_id)
                except ObjectDoesNotExist:
                    logger.warning(f"Alert ID {alert_id} not found")
                    return JsonResponse(
                        {"success": False, "message": "Alert not found"},
                        status=404,
                    )

                if alert.acknowledged:
                    logger.info(f"Alert ID {alert_id} already acknowledged.")
                    return JsonResponse(
                        {
                            "success": True,
                            "message": "Alert already acknowledged.",
                            "data": {
                                "id": alert.id,
                                "acknowledged": True,
                                "timestamp": alert.timestamp,
                            },
                        },
                        status=200,
                    )

                # Mark as acknowledged
                alert.acknowledged = True
                alert.save(update_fields=["acknowledged"])

                logger.info(f"Alert ID {alert_id} acknowledged successfully.")

                return JsonResponse(
                    {
                        "success": True,
                        "message": "Alert acknowledged successfully.",
                        "data": {
                            "id": alert.id,
                            "acknowledged": True,
                            "timestamp": alert.timestamp,
                        },
                    },
                    status=200,
                )

        except Exception as e:
            logger.exception(f"Unexpected error acknowledging alert {alert_id}: {e}")
            return JsonResponse(
                {
                    "success": False,
                    "message": "Internal server error while acknowledging alert.",
                },
                status=500,
            )
