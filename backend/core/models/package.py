from django.db import models


class Package(models.Model):
    mailitm_fid = models.CharField(max_length=50, unique=True)
    country = models.CharField(max_length=10, null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)
    status = models.CharField(
        max_length=32, null=True, blank=True
    )  # 'success', 'failure', 'in_process'
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
    alert_after_seizure = models.BooleanField(
        default=False
    )  # new events while still seized
    last_known_location = models.CharField(max_length=255, null=True, blank=True)
    last_event_type_cd = models.CharField(
        max_length=50, null=True, blank=True, db_index=True
    )
    last_event_timestamp = models.DateTimeField(null=True)

    # TODO:
    # success_afte_one_fail : int
    # is_currently in customs : yes, no, confistecated
    # customs_latest_interaction: datetime
    # ~~is returned: 36, fail, + returing path to spcific states~~
    # event count of transition after failure. event 32
    # last Known_location
    def __str__(self):
        return self.mailitm_fid

    class Meta:
        indexes = [
            models.Index(fields=["mailitm_fid"]),
            models.Index(fields=["status"]),  # speeds up stats queries
        ]
