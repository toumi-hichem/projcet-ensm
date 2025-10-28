from rest_framework.serializers import ModelSerializer
from core.models import UploadMetaData


class UploadMetaDataSerializer(ModelSerializer):
    class Meta:
        model = UploadMetaData
        fields = "__all__"
