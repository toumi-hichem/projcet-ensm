from rest_framework.serializers import ModelSerializer
from core.models import CPXStats, CTNIStats, AirportStats


class CTNIStatsSerializer(ModelSerializer):
    class Meta:
        model = CTNIStats
        fields = "__all__"


class CPXStatsSerializer(ModelSerializer):
    class Meta:
        model = CPXStats
        fields = "__all__"


class AirportStatsSerializer(ModelSerializer):
    class Meta:
        model = AirportStats
        fields = "__all__"
