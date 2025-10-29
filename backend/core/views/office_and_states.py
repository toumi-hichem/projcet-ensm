from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import State


class StateAndPostalOfficeApiView(APIView):
    """
    Returns all states and their postal offices in JSON format.
    Example:
    [
      {
        "id": 1,
        "name": "Algiers",
        "geometry": {...},
        "postal_offices": [
          {"id": 1, "name": "Bab Ezzouar"},
          {"id": 2, "name": "El Harrach"}
        ]
      },
      ...
    ]
    """

    def get(self, request):
        states = State.objects.prefetch_related("postal_offices").all()

        data = [
            {
                "id": state.id,
                "name": state.name,
                "code": state.code,
                "geometry": state.geometry,
                "postal_offices": [
                    {"id": office.id, "name": office.name}
                    for office in state.postal_offices.all()
                ],
            }
            for state in states
        ]

        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)
