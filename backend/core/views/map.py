from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import StateStats, OfficeStats, Alert
from core.serializers import StateStatsSerializer, OfficeStatsSerializer


class OneStateAPIView(APIView):
    """
    Gives you KPIs as well as alerts about one state
    """

    # TODO: States with alarms, and their count.
    # "statesWithAlarm: [state: {alarmCount:num, }]"

    def get(self, request, stateID):
        try:
            # get latest state record for that ID
            state = StateStats.objects.filter(state_id=stateID).order_by("-id").first()
            if not state:
                return Response(
                    {"success": False, "message": f"No state found with ID {stateID}."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # fetch alerts for that state (latest first)
            alerts = (
                Alert.objects.filter(state=state)
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

            serialized_state = StateStatsSerializer(state).data

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
    Gives you KPIs as well as alerts about one postal office
    """

    def get(self, request, officeID):
        try:
            # get latest office record for that ID
            office = (
                OfficeStats.objects.filter(office_name=officeID)
                .order_by("-office_name")
                .first()
            )
            if not office:
                return Response(
                    {
                        "success": False,
                        "message": f"No office found with ID {officeID}.",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # fetch alerts for that office (latest first)
            alerts = (
                Alert.objects.filter(office=office)
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

            serialized_office = OfficeStatsSerializer(office).data

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
