from rest_framework.serializers import ModelSerializer
from core.models import KPIHistory


class KPIHistorySerializer(ModelSerializer):
    class Meta:
        model = KPIHistory
        fields = ["kpi_name", "timestamp", "value"]
