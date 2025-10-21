from django.db import models


class PackageEvent(models.Model):
    mailitm_fid = models.CharField(max_length=50, db_index=True)
    date = models.DateTimeField()
    event_type_cd = models.CharField(
        max_length=50, null=True, blank=True, db_index=True
    )
    etablissement_postal = models.CharField(
        max_length=255, null=True, blank=True, db_index=True
    )
    next_etablissement_postal = models.CharField(
        max_length=255, null=True, blank=True, db_index=True
    )
    duration_to_next_step = models.DurationField(null=True, blank=True)

    class Meta:
        # ✅ Old style (still works):
        unique_together = (
            "mailitm_fid",
            "date",
            "event_type_cd",
            "etablissement_postal",
        )

        # ✅ Modern way (preferred in Django ≥ 3.0):
        # constraints = [
        #     models.UniqueConstraint(
        #         fields=['mailitm_fid', 'date', 'event_type_cd', 'etablissement_postal'],
        #         name='unique_package_event'
        #     )
        # ]

        indexes = [
            models.Index(fields=["mailitm_fid"]),
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.mailitm_fid} @ {self.date}"
