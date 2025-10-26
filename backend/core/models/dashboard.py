from django.db import models
from django.utils import timezone


class Dashboard(models.Model):
    # Timestamp of when this KPI snapshot was last updated
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    # -------------------------------
    # 📦 Counts (Operational Volumes)
    # -------------------------------

    # Number of dispatches that have been electronically pre-announced
    # but have not yet physically arrived.
    pre_arrived_dispatches_count = models.IntegerField()

    # Total number of parcels or mail items successfully delivered to recipients.
    items_delivered = models.IntegerField()

    # Number of items that were delivered successfully
    # after one previous failed delivery attempt.
    items_delivered_after_one_fail = models.IntegerField()

    # Number of items that could not be delivered at all
    # (e.g., refused, wrong address, recipient not found).
    undelivered_items = models.IntegerField()

    # -------------------------------
    # 📈 KPI Rates (Performance)
    # -------------------------------

    # Overall delivery success rate, expressed as a percentage (0–100).
    delivery_rate = models.FloatField()

    # Percentage of items delivered within expected deadlines.
    on_time_delivery_rate = models.FloatField()

    # -------------------------------
    # ⏱️ Delays and Exceptions
    # -------------------------------

    # Number of parcels that have exceeded their allowed holding time
    # (i.e., still waiting for pickup at the post office past the time limit).
    items_exceeding_holding_time = models.IntegerField()

    # Number of items currently held or delayed in customs.
    items_blocked_in_customs = models.IntegerField()

    # Number of items returned to the sender due to non-delivery.
    returned_items = models.IntegerField()

    # -------------------------------
    # 🚚 Transit Time KPIs (Delays)
    # -------------------------------

    # Average time (in days or hours) taken to group or consolidate items
    # before dispatching them from the origin.
    consolidation_time = models.TextField()

    # Average end-to-end transit time (in days or hours),
    # measured from posting to final delivery.
    end_to_end_transit_time_average = models.TextField()

    # Average time (in days or hours) taken to consolidate shipments
    # before they are forwarded to the next stage.
    shipment_consolidation_time = models.TextField()

    # -------------------------------
    # ⚠️ Exceptions / Traceability
    # -------------------------------

    # Number of items that have NOT been scanned (missing tracking data).
    # Helps identify traceability issues in the workflow.
    unscanned_items = models.IntegerField()

    def __str__(self):
        return f"Dashboard snapshot at {self.timestamp:%Y-%m-%d %H:%M}"
