from django.db import models
from django.utils import timezone


class UploadMetaData(models.Model):
    filename = models.CharField(max_length=255)
    file_size_bytes = models.BigIntegerField()
    file_type = models.CharField(max_length=20)
    upload_timestamp = models.DateTimeField(default=timezone.now)
    processing_duration_seconds = models.FloatField(null=True, blank=True)

    # DataFrame stats
    n_rows = models.IntegerField()
    n_columns = models.IntegerField()
    columns = models.JSONField()
    missing_values_count = models.IntegerField()
    missing_values_by_column = models.JSONField(blank=True, null=True)
    unique_packages_count = models.IntegerField()
    unique_event_types = models.IntegerField()
    top_event_types = models.JSONField(blank=True, null=True)

    # Date range
    earliest_date = models.DateTimeField(null=True, blank=True)
    latest_date = models.DateTimeField(null=True, blank=True)
    time_range_days = models.IntegerField(null=True, blank=True)

    # Processing
    events_inserted = models.IntegerField()
    packages_created = models.IntegerField()
    packages_updated = models.IntegerField()
    alerts_created = models.IntegerField()

    # Cleaning summary
    cleaning_time_seconds = models.FloatField(null=True, blank=True)
    avg_step_duration_seconds = models.FloatField(null=True, blank=True)
    avg_total_duration_seconds = models.FloatField(null=True, blank=True)
    rows_removed_duplicates = models.IntegerField(null=True, blank=True)
    rows_removed_invalid = models.IntegerField(null=True, blank=True)

    # Optional remarks
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.filename} ({self.upload_timestamp:%Y-%m-%d})"
