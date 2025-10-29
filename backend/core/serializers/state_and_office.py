from rest_framework.serializers import ModelSerializer
from core.models import State, PostalOffice


class StateSerializer(ModelSerializer):
    class Meta:
        model = State
        fields = "__all__"


class PostalOfficeSerializer(ModelSerializer):
    class Meta:
        model = PostalOffice
        fields = "__all__"
