from django.db import models
from .package import Package


class PackageTransition(models.Model):
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
    origin_upw = models.IntegerField(db_index=True)
    dest_upw = models.IntegerField(db_index=True)
    actual_duration = models.DurationField()
    allowed_duration = models.DurationField(null=True)
    late = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["package"]),
            models.Index(fields=["origin_upw", "dest_upw"]),
        ]
