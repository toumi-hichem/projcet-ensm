from rest_framework.serializers import ModelSerializer
from core.models import Dashboard


class DashboardSerializer(ModelSerializer):
    class Meta:
        model = Dashboard
        fields = "__all__"
