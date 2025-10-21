from django.db import models


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

    state = models.ForeignKey(
        "StateStats",
        related_name="alerts",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    office = models.ForeignKey(
        "OfficeStats",
        related_name="alerts",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.alarm_code} - {self.title}"


class StateStats(models.Model):
    state_name = models.TextField()
    state_number = models.IntegerField()
    state_id = models.TextField()
    state_alternative_name = models.TextField()

    pre_arrived_dispatches_count = models.IntegerField()
    items_delivered = models.IntegerField()
    undelivered_items = models.IntegerField()


class OfficeStats(models.Model):
    office_name = models.TextField()
    office_id = models.TextField()
    office_alternative_name = models.TextField()

    pre_arrived_dispatches_count = models.IntegerField()
    items_delivered = models.IntegerField()
    undelivered_items = models.IntegerField()
