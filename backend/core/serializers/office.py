from rest_framework.serializers import ModelSerializer
from core.models import StateStats, OfficeStats


class StateStatsSerializer(ModelSerializer):
    class Meta:
        model = StateStats
        fields = "__all__"


class OfficeStatsSerializer(ModelSerializer):
    class Meta:
        model = OfficeStats
        fields = "__all__"
