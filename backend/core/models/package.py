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
    alert_after_success = models.BooleanField(default=False)

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
