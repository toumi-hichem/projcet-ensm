from django.db import models
from .states_offices import State, PostalOffice


class BagEvent(models.Model):
    receptacle_fid = models.CharField(max_length=50, db_index=True)
    date = models.DateTimeField()
    event_typecd = models.CharField(max_length=50, null=True, blank=True)
    etablissement_postal = models.CharField(max_length=255, null=True, blank=True)
    nextetablissement_postal = models.CharField(max_length=255, null=True, blank=True)
    country = models.CharField(max_length=10, null=True, blank=True)
    duration_to_next_step = models.DurationField(null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)
    office = models.ForeignKey(
        PostalOffice, null=True, on_delete=models.SET_NULL, related_name="bag_events"
    )
    next_office = models.ForeignKey(
        PostalOffice,
        null=True,
        on_delete=models.SET_NULL,
        related_name="bag_next_events",
    )
    state = models.ForeignKey(
        State,
        null=True,
        on_delete=models.SET_NULL,
        related_name="bag_events",
    )
    next_state = models.ForeignKey(
        State,
        null=True,
        on_delete=models.SET_NULL,
        related_name="bag_next_events",
    )

    class Meta:
        unique_together = (
            "receptacle_fid",
            "date",
            "event_typecd",
            "etablissement_postal",
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

    @property
    def hub_name(self):
        # For example, first event's office/state determines the hub
        first_event = self.bagevent_set.order_by("date").first()
        if first_event:
            return first_event.office.name  # or any logic
        return None

    def __str__(self):
        return self.receptacle_fid

    class Meta:
        indexes = [
            models.Index(fields=["receptacle_fid"]),
            models.Index(fields=["country"]),
        ]
