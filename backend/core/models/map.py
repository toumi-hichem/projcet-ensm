from django.db import models
from .states_offices import State, PostalOffice


class Alert(models.Model):
    class AlarmType(models.TextChoices):
        ALR001 = "ALR001", "Envois non réceptionnés après transmission"
        ALR002 = "ALR002", "Envois en attente de distribution"
        ALR003 = "ALR003", "Dépassement du délai de garde"
        ALR004 = "ALR004", "Dépêche en attente de traitement – Centre Aéropostal HB"
        ALR005 = "ALR005", "Dépêche non réceptionnée – Alger CPX"
        ALR006 = "ALR006", "Envois non réceptionnés – CTNI"
        ALR007 = "ALR007", "Incident d’exploitation – Absence d’événements"
        ALR008 = "ALR008", "Délais de concentration excessifs"

    timestamp = models.DateTimeField(auto_now_add=True)
    alarm_code = models.CharField(max_length=10, choices=AlarmType.choices)
    title = models.CharField(max_length=255)
    trigger_condition = models.TextField()
    severity = models.CharField(max_length=50)
    action_required = models.TextField()
    acknowledged = models.BooleanField(default=False)

    office = models.ForeignKey(
        PostalOffice,
        null=True,
        blank=True,
        related_name="alerts",
        on_delete=models.SET_NULL,
    )
    state = models.ForeignKey(
        State,
        null=True,
        blank=True,
        related_name="alerts",
        on_delete=models.SET_NULL,
    )

    def __str__(self):
        return f"{self.alarm_code} - {self.title}"


class StateStats(models.Model):
    state = models.OneToOneField(
        State,
        related_name="stats",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    pre_arrived_dispatches_count = models.IntegerField(default=0)
    items_delivered = models.IntegerField(default=0)
    undelivered_items = models.IntegerField(default=0)

    def __str__(self):
        return f"Stats for {self.state.name}"


class OfficeStats(models.Model):
    office = models.OneToOneField(
        PostalOffice,
        related_name="stats",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    pre_arrived_dispatches_count = models.IntegerField(default=0)
    items_delivered = models.IntegerField(default=0)
    undelivered_items = models.IntegerField(default=0)

    def __str__(self):
        return f"Stats for {self.office.name}"
