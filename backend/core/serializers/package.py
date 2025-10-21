from rest_framework.serializers import ModelSerializer
from core.models import Package, PackageEvent


class PackageSerializer(ModelSerializer):
    class Meta:
        model = Package
        fields = "__all__"


class PackageEventSerializer(ModelSerializer):
    class Meta:
        model = PackageEvent
        fields = "__all__"
