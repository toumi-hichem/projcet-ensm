from django.db import models


class KPIHistory(models.Model):
    kpi_name = models.CharField(max_length=100, db_index=True)
    timestamp = models.DateTimeField(db_index=True)
    value = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["kpi_name", "timestamp"]),
        ]
        unique_together = ("kpi_name", "timestamp")

    def __str__(self):
        return f"{self.kpi_name} @ {self.timestamp}: {self.value}"
