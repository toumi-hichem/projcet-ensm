from django.db import models


class CTNIStats(models.Model):
    # Timestamp of when this KPI snapshot was last updated
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # -------------------------------
    # 📦 Counts (Operational Volumes)
    # -------------------------------

    # Number of dispatches that have been electronically pre-announced
    # but have not yet physically arrived.
    ctni_pre_arrived_dispatches_count = models.IntegerField()

    # Total number of parcels or mail items successfully delivered to recipients.
    ctni_items_delivered = models.IntegerField()

    # Number of items that were delivered successfully
    # after one previous failed delivery attempt.
    ctni_items_delivered_after_one_fail = models.IntegerField()

    # Number of items that could not be delivered at all
    # (e.g., refused, wrong address, recipient not found).
    ctni_undelivered_items = models.IntegerField()

    # -------------------------------
    # 📈 KPI Rates (Performance)
    # -------------------------------

    # Overall delivery success rate, expressed as a percentage (0–100).
    ctni_delivery_rate = models.FloatField()

    # Percentage of items delivered within expected deadlines.
    ctni_on_time_delivery_rate = models.FloatField()

    # -------------------------------
    # ⏱️ Delays and Exceptions
    # -------------------------------

    # Number of parcels that have exceeded their allowed holding time
    # (i.e., still waiting for pickup at the post office past the time limit).
    ctni_items_exceeding_holding_time = models.IntegerField()

    # Number of items currently held or delayed in customs.
    ctni_items_blocked_in_customs = models.IntegerField()

    # Number of items returned to the sender due to non-delivery.
    ctni_returned_items = models.IntegerField()

    # -------------------------------
    # 🚚 Transit Time KPIs (Delays)
    # -------------------------------

    # Average time (in days or hours) taken to group or consolidate items
    # before dispatching them from the origin.
    ctni_consolidation_time = models.TextField()

    # Average end-to-end transit time (in days or hours),
    # measured from posting to final delivery.
    ctni_end_to_end_transit_time_average = models.TextField()

    # Average time (in days or hours) taken to consolidate shipments
    # before they are forwarded to the next stage.
    ctni_shipment_consolidation_time = models.TextField()

    # -------------------------------
    # ⚠️ Exceptions / Traceability
    # -------------------------------

    # Number of items that have NOT been scanned (missing tracking data).
    # Helps identify traceability issues in the workflow.
    ctni_unscanned_items = models.IntegerField()

    def __str__(self):
        return f"Dashboard snapshot at {self.timestamp:%Y-%m-%d %H:%M}"


class CPXStats(models.Model):
    # Timestamp of when this KPI snapshot was last updated
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # -------------------------------
    # 📦 Counts (Operational Volumes)
    # -------------------------------

    # Number of dispatches that have been electronically pre-announced
    # but have not yet physically arrived.
    cpx_pre_arrived_dispatches_count = models.IntegerField()

    # Total number of parcels or mail items successfully delivered to recipients.
    cpx_items_delivered = models.IntegerField()

    # Number of items that were delivered successfully
    # after one previous failed delivery attempt.
    cpx_items_delivered_after_one_fail = models.IntegerField()

    # Number of items that could not be delivered at all
    # (e.g., refused, wrong address, recipient not found).
    cpx_undelivered_items = models.IntegerField()

    # -------------------------------
    # 📈 KPI Rates (Performance)
    # -------------------------------

    # Overall delivery success rate, expressed as a percentage (0–100).
    cpx_delivery_rate = models.FloatField()

    # Percentage of items delivered within expected deadlines.
    cpx_on_time_delivery_rate = models.FloatField()

    # -------------------------------
    # ⏱️ Delays and Exceptions
    # -------------------------------

    # Number of parcels that have exceeded their allowed holding time
    # (i.e., still waiting for pickup at the post office past the time limit).
    cpx_items_exceeding_holding_time = models.IntegerField()

    # Number of items currently held or delayed in customs.
    cpx_items_blocked_in_customs = models.IntegerField()

    # Number of items returned to the sender due to non-delivery.
    cpx_returned_items = models.IntegerField()

    # -------------------------------
    # 🚚 Transit Time KPIs (Delays)
    # -------------------------------

    # Average time (in days or hours) taken to group or consolidate items
    # before dispatching them from the origin.
    cpx_consolidation_time = models.TextField()

    # Average end-to-end transit time (in days or hours),
    # measured from posting to final delivery.
    cpx_end_to_end_transit_time_average = models.TextField()

    # Average time (in days or hours) taken to consolidate shipments
    # before they are forwarded to the next stage.
    cpx_shipment_consolidation_time = models.TextField()

    # -------------------------------
    # ⚠️ Exceptions / Traceability
    # -------------------------------

    # Number of items that have NOT been scanned (missing tracking data).
    # Helps identify traceability issues in the workflow.
    cpx_unscanned_items = models.IntegerField()

    def __str__(self):
        return f"Dashboard snapshot at {self.timestamp:%Y-%m-%d %H:%M}"


class AirportStats(models.Model):
    # Timestamp of when this KPI snapshot was last updated
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # -------------------------------
    # 📦 Counts (Operational Volumes)
    # -------------------------------

    # Number of dispatches that have been electronically pre-announced
    # but have not yet physically arrived.
    airport_pre_arrived_dispatches_count = models.IntegerField()

    # Total number of parcels or mail items successfully delivered to recipients.
    airport_items_delivered = models.IntegerField()

    # Number of items that were delivered successfully
    # after one previous failed delivery attempt.
    airport_items_delivered_after_one_fail = models.IntegerField()

    # Number of items that could not be delivered at all
    # (e.g., refused, wrong address, recipient not found).
    airport_undelivered_items = models.IntegerField()

    # -------------------------------
    # 📈 KPI Rates (Performance)
    # -------------------------------

    # Overall delivery success rate, expressed as a percentage (0–100).
    airport_delivery_rate = models.FloatField()

    # Percentage of items delivered within expected deadlines.
    airport_on_time_delivery_rate = models.FloatField()

    # -------------------------------
    # ⏱️ Delays and Exceptions
    # -------------------------------

    # Number of parcels that have exceeded their allowed holding time
    # (i.e., still waiting for pickup at the post office past the time limit).
    airport_items_exceeding_holding_time = models.IntegerField()

    # Number of items currently held or delayed in customs.
    airport_items_blocked_in_customs = models.IntegerField()

    # Number of items returned to the sender due to non-delivery.
    airport_returned_items = models.IntegerField()

    # -------------------------------
    # 🚚 Transit Time KPIs (Delays)
    # -------------------------------

    # Average time (in days or hours) taken to group or consolidate items
    # before dispatching them from the origin.
    airport_consolidation_time = models.TextField()

    # Average end-to-end transit time (in days or hours),
    # measured from posting to final delivery.
    airport_end_to_end_transit_time_average = models.TextField()

    # Average time (in days or hours) taken to consolidate shipments
    # before they are forwarded to the next stage.
    airport_shipment_consolidation_time = models.TextField()

    # -------------------------------
    # ⚠️ Exceptions / Traceability
    # -------------------------------

    # Number of items that have NOT been scanned (missing tracking data).
    # Helps identify traceability issues in the workflow.
    airport_unscanned_items = models.IntegerField()

    def __str__(self):
        return f"Dashboard snapshot at {self.timestamp:%Y-%m-%d %H:%M}"
