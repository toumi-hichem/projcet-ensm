from rest_framework.serializers import ModelSerializer
from core.models import UploadMetaData, BagUploadMetaData


class UploadMetaDataSerializer(ModelSerializer):
    class Meta:
        model = UploadMetaData
        fields = "__all__"


class BagUploadMetaDataSerializer(ModelSerializer):
    class Meta:
        model = BagUploadMetaData
        fields = "__all__"
