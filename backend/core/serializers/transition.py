from rest_framework.serializers import ModelSerializer
from core.models import PackageTransition


class PackageTransitionSerializer(ModelSerializer):
    class Meta:
        model = PackageTransition
        fields = "__all__"
