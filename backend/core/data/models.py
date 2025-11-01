from django.db import models


class Package(models.Model):
    mailitm_fid = models.CharField(max_length=50, unique=True)
    country = models.CharField(max_length=10, null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)
    status = models.CharField(max_length=32, null=True, blank=True)  # 'success', 'failure', 'in_process'
    delivered_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    cities_after_failure_count = models.IntegerField(default=0)
    alert_after_success = models.BooleanField(default=False)
    failure_before_success_count = models.IntegerField(default=0)
    recovered_after_failure = models.BooleanField(default=False)
    flag_seized = models.BooleanField(default=False)  # True = currently in customs
    seized_at = models.DateTimeField(null=True, blank=True)
    exited_at = models.DateTimeField(null=True, blank=True)
    hold_duration = models.DurationField(null=True, blank=True)
    alert_after_seizure = models.BooleanField(default=False)  # new events while still seized
    last_known_location = models.CharField(max_length=255, null=True, blank=True)




    def __str__(self):
        return self.mailitm_fid

    class Meta:
        indexes = [
            models.Index(fields=["mailitm_fid"]),
            models.Index(fields=["status"]),  # speeds up stats queries
        ]


class PackageEvent(models.Model):
    mailitm_fid = models.CharField(max_length=50, db_index=True)
    date = models.DateTimeField()
    event_type_cd = models.CharField(max_length=50, null=True, blank=True)
    etablissement_postal = models.CharField(max_length=255, null=True, blank=True)
    next_etablissement_postal = models.CharField(max_length=255, null=True, blank=True)
    duration_to_next_step = models.DurationField(null=True, blank=True)
    code_upw = models.CharField(max_length=5, null=True, blank=True)

    class Meta:
        # ✅ Old style (still works):
        unique_together = ('mailitm_fid', 'date', 'event_type_cd', 'etablissement_postal')

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
    


class PackageTransition(models.Model):
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
    origin_upw = models.IntegerField()
    dest_upw = models.IntegerField()
    actual_duration = models.DurationField()
    allowed_duration = models.DurationField(null=True)
    late = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["package"]),
            models.Index(fields=["origin_upw", "dest_upw"]),
        ]

class BagEvent(models.Model):
    receptacle_fid = models.CharField(max_length=50, db_index=True)
    date = models.DateTimeField()
    event_typecd = models.CharField(max_length=50, null=True, blank=True)
    etablissement_postal = models.CharField(max_length=255, null=True, blank=True)
    nextetablissement_postal = models.CharField(max_length=255, null=True, blank=True)
    country = models.CharField(max_length=10, null=True, blank=True)
    duration_to_next_step = models.DurationField(null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)

    class Meta:
        unique_together = (
            'receptacle_fid',
            'date',
            'event_typecd',
            'etablissement_postal',
        )
        indexes = [
            models.Index(fields=["receptacle_fid"]),
            models.Index(fields=["date"]),
            models.Index(fields=["country"]),
        ]

    def __str__(self):
        return f"{self.receptacle_fid} @ {self.date}"


class Bag(models.Model):
    """
    Represents a unique mail bag (receptacle) entity.
    Derived from BagEvent data aggregation.
    """
    receptacle_fid = models.CharField(max_length=50, unique=True)
    country = models.CharField(max_length=10, null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)
    last_known_location = models.CharField(max_length=255, null=True, blank=True)
    first_event_date = models.DateTimeField(null=True, blank=True)
    last_event_date = models.DateTimeField(null=True, blank=True)
    events_count = models.IntegerField(default=0)

    def __str__(self):
        return self.receptacle_fid

    class Meta:
        indexes = [
            models.Index(fields=["receptacle_fid"]),
            models.Index(fields=["country"]),
        ]
