from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import StateStats, OfficeStats, Alert
from core.serializers import StateStatsSerializer, OfficeStatsSerializer


class OneStateAPIView(APIView):
    """
    Returns KPIs and alerts for a given state.
    """

    def get(self, request, stateID):
        try:
            # Fetch StateStats for the given state ID
            state_stats = StateStats.objects.filter(state_id=stateID).first()
            if not state_stats:
                return Response(
                    {"success": False, "message": f"No state found with ID {stateID}."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Fetch alerts for this state
            alerts = (
                Alert.objects.filter(state=state_stats.state)
                .order_by("-timestamp")
                .values(
                    "id",
                    "timestamp",
                    "alarm_code",
                    "title",
                    "trigger_condition",
                    "severity",
                    "action_required",
                    "acknowledged",
                )
            )

            serialized_state = StateStatsSerializer(state_stats).data

            return Response(
                {
                    "success": True,
                    "state": serialized_state,
                    "alerts": list(alerts),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "message": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OneOfficeAPIView(APIView):
    """
    Returns KPIs and alerts for a given postal office.
    """

    def get(self, request, officeID):
        try:
            # Fetch OfficeStats for the given office ID
            office_stats = OfficeStats.objects.filter(office_id=officeID).first()
            if not office_stats:
                return Response(
                    {
                        "success": False,
                        "message": f"No office found with ID {officeID}.",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Fetch alerts for this office
            alerts = (
                Alert.objects.filter(office=office_stats.office)
                .order_by("-timestamp")
                .values(
                    "id",
                    "timestamp",
                    "alarm_code",
                    "title",
                    "trigger_condition",
                    "severity",
                    "action_required",
                    "acknowledged",
                )
            )

            serialized_office = OfficeStatsSerializer(office_stats).data

            return Response(
                {
                    "success": True,
                    "office": serialized_office,
                    "alerts": list(alerts),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "message": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
