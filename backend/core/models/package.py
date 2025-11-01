from django.db import models
from .states_offices import State, PostalOffice


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
    alert_after_seizure = models.BooleanField(default=False)
    last_known_location = models.CharField(max_length=255, null=True, blank=True)
    last_event_type_cd = models.CharField(
        max_length=50, null=True, blank=True, db_index=True
    )
    last_event_timestamp = models.DateTimeField(null=True)
    bag = models.ForeignKey(
        "Bag",
        related_name="packages",
        on_delete=models.CASCADE,
        null=True,  # safe for old data
        blank=True,
    )

    def get_type(self):
        """Return the product type based on the mailitm_fid."""
        PRODUCT_TYPE_MAP = {
            "EMS": ("EA", "EZ"),
            "Letter Post Tracked": ("LA", "LZ"),
            "M bags": ("MA", "MZ"),
            "IBRS": ("QA", "QM"),
            "Letter Post Registered": ("RA", "RZ"),
            "Letter Post (goods)": ("UA", "UZ"),
            "Letter Post Insured": ("VA", "VZ"),
            "Parcel Post": ("CA", "CZ"),
            "ECOMPRO Parcel": ("HA", "HZ"),
        }
        if not isinstance(self.mailitm_fid, str) or len(self.mailitm_fid) < 2:
            return "UNKNOWN"
        indicator = self.mailitm_fid[:2].upper()
        for ptype, (start, end) in PRODUCT_TYPE_MAP.items():
            if start <= indicator <= end:
                return ptype
        return "Other/Unknown"

    def __str__(self):
        return self.mailitm_fid

    class Meta:
        indexes = [
            models.Index(fields=["mailitm_fid"]),
            models.Index(fields=["status"]),
        ]


class PackageEvent(models.Model):
    # ✅ new: direct reference to Package (One-to-Many)
    package = models.ForeignKey(
        "Package",
        related_name="events",
        on_delete=models.CASCADE,
        null=True,  # safe for old data
        blank=True,
    )

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

    # ✅ new: link to PostalOffice and State
    office = models.ForeignKey(
        PostalOffice, null=True, on_delete=models.SET_NULL, related_name="events"
    )
    next_office = models.ForeignKey(
        PostalOffice, null=True, on_delete=models.SET_NULL, related_name="next_events"
    )
    state = models.ForeignKey(
        State,
        null=True,
        on_delete=models.SET_NULL,
        related_name="events",
    )
    next_state = models.ForeignKey(
        State,
        null=True,
        on_delete=models.SET_NULL,
        related_name="next_events",
    )

    class Meta:
        unique_together = (
            "mailitm_fid",
            "date",
            "event_type_cd",
            "etablissement_postal",
        )
        indexes = [
            models.Index(fields=["mailitm_fid"]),
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.mailitm_fid} @ {self.date}"
