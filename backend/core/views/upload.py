from core.serializers import UploadMetaDataSerializer
import pandas as pd
from django.db.models import Q, Count, Sum, Max
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

# from django.utils import timezone
from core.models import (
    Package,
    PackageEvent,
    PackageTransition,
    Dashboard,
    PostalOffice,
    Alert,
    UploadMetaData,
)
from django.utils.dateparse import parse_date

from core.utils.cleaning import clean_package_data, save_upload_metadata
from core.utils.transitions_helper import build_transitions, df_etab
from core.utils.alert_defs import ALERT_DEFINITIONS
import logging
import time

logger = logging.getLogger(__name__)
MAX_ALLOWED_DAYS = 365 * 5  # Max 5 years
SLA_DAYS = 15


# ----------------------------
# Upload CSV and save events + packages
# ----------------------------


class UploadCSVAndSave(APIView):
    def get(self, request):
        """
        GET /api/uploads/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

        Returns all UploadMetaData records within the date range.
        """
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")

        # Parse parameters
        start_date = parse_date(start_date_str) if start_date_str else None
        end_date = parse_date(end_date_str) if end_date_str else None

        # Build query
        uploads = UploadMetaData.objects.all()
        if start_date and end_date:
            uploads = uploads.filter(
                upload_timestamp__date__range=(start_date, end_date)
            )
        elif start_date:
            uploads = uploads.filter(upload_timestamp__date__gte=start_date)
        elif end_date:
            uploads = uploads.filter(upload_timestamp__date__lte=end_date)

        uploads = uploads.order_by("-upload_timestamp")
        serializer = UploadMetaDataSerializer(uploads)
        return Response(
            {"success": True, "data": serializer, "count": len(serializer)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, format=None):
        import pytz
        from django.utils import timezone
        import pandas as pd

        file_obj = request.FILES.get("file")
        if not file_obj:
            logger.warning("No file provided in upload request.")
            return Response({"error": "No file provided."}, status=400)

        logger.info(f"Received file upload: {file_obj.name} ({file_obj.size} bytes)")

        try:
            # --- Clean CSV data ---
            logger.info("Starting CSV data cleaning...")
            df_clean, metadata = clean_package_data(file_obj)
            record = save_upload_metadata(
                file_obj,
                metadata,
                extra_stats={
                    "events_inserted": 123,
                    "packages_created": 45,
                    "packages_updated": 12,
                },
            )
            df_clean["date"] = pd.to_datetime(
                df_clean["date"], errors="coerce", utc=True
            )
            logger.debug(f"Cleaned dataframe shape: {df_clean.shape}")

            # --- Bulk insert PackageEvents ---
            event_fields = [
                "MAILITM_FID",
                "date",
                "EVENT_TYPE_CD",
                "établissement_postal",
                "next_établissement_postal",
                "duration_to_next_step",
            ]
            event_objs = [
                PackageEvent(
                    mailitm_fid=row["MAILITM_FID"],
                    date=row["date"],
                    event_type_cd=row.get("EVENT_TYPE_CD"),
                    etablissement_postal=row.get("établissement_postal"),
                    next_etablissement_postal=row.get("next_établissement_postal"),
                    duration_to_next_step=row.get("duration_to_next_step"),
                )
                for _, row in df_clean[event_fields].iterrows()
            ]
            PackageEvent.objects.bulk_create(
                event_objs, batch_size=1000, ignore_conflicts=True
            )
            logger.info(f"Inserted {len(event_objs)} PackageEvents successfully.")

            # --- Prepare PostalOffice map ---
            office_map = {
                o.name.lower(): o
                for o in PostalOffice.objects.select_related("state").all()
            }

            # --- Process Packages and Alerts in memory ---
            package_objs = []
            all_alerts_to_create = []

            unique_ids = df_clean["MAILITM_FID"].unique()
            logger.info(f"Processing {len(unique_ids)} unique packages...")

            # Prefetch existing packages to update later
            existing_packages_qs = Package.objects.filter(mailitm_fid__in=unique_ids)
            existing_packages_map = {p.mailitm_fid: p for p in existing_packages_qs}

            # Prefetch existing alerts to deduplicate
            timestamps = df_clean["date"].tolist()
            existing_alerts_qs = Alert.objects.filter(timestamp__in=timestamps)
            existing_alerts_set = set(
                (a.alarm_code, a.timestamp, a.office_id, a.state_id)
                for a in existing_alerts_qs
            )

            for mailitm_fid, sub in df_clean.groupby("MAILITM_FID"):
                sub = sub.sort_values("date")
                last_event = sub.iloc[-1]
                last_event_type_cd = last_event["EVENT_TYPE_CD"]
                last_event_timestamp = last_event["date"]
                last_known_location = last_event.get("établissement_postal")

                # --- Determine package status and customs flags ---
                status_val = "in_process"
                delivered_at = None
                failed_at = None
                alert_after_success = False
                flag_seized = False
                seized_at = None
                exited_at = None
                hold_duration = None
                alert_after_seizure = False
                cities_after_failure_count = 0
                failure_before_success_count = 0
                recovered_after_failure = False

                customs_codes = ["4", "6", "7", "31", "38"]
                customs_rows = sub[
                    sub["EVENT_TYPE_CD"].isin(customs_codes)
                ].sort_values("date")

                if not customs_rows.empty:
                    latest_event = customs_rows.iloc[-1]
                    latest_code = latest_event["EVENT_TYPE_CD"]
                    latest_date = latest_event["date"]
                    if latest_code in ["4", "6", "31"]:
                        flag_seized = True
                        seized_at = latest_date
                        later_events = sub[sub["date"] > seized_at]
                        if not later_events.empty and not any(
                            later_events["EVENT_TYPE_CD"].isin(["7", "38"])
                        ):
                            alert_after_seizure = True
                    elif latest_code in ["7", "38"]:
                        exited_at = latest_date
                        prev_seizure = customs_rows[
                            customs_rows["EVENT_TYPE_CD"].isin(["4", "6", "31"])
                        ]
                        if not prev_seizure.empty:
                            seized_at = prev_seizure.iloc[-1]["date"]
                            hold_duration = exited_at - seized_at

                success_rows = sub[sub["EVENT_TYPE_CD"] == "37"]
                failure_rows = sub[sub["EVENT_TYPE_CD"] == "36"]

                if not success_rows.empty:
                    status_val = "success"
                    delivered_at = success_rows.iloc[0]["date"]
                    failures_before = failure_rows[failure_rows["date"] < delivered_at]
                    failure_before_success_count = len(failures_before)
                    recovered_after_failure = failure_before_success_count > 0
                    if success_rows.index[0] < sub.index[-1]:
                        alert_after_success = True
                elif not failure_rows.empty:
                    status_val = "failure"
                    failed_at = failure_rows.iloc[0]["date"]
                    last_failure_index = sub[sub["EVENT_TYPE_CD"] == "36"].index[-1]
                    after_failure = sub.loc[last_failure_index + 1 :]
                    cities_after_failure_count = (
                        after_failure["EVENT_TYPE_CD"] == "32"
                    ).sum()

                # --- Build alerts for this package ---
                alerts_to_create = []

                # ALR001-ALR008 rules (as in first version)
                local_tz = pytz.timezone("Africa/Algiers")
                transmissions = sub[sub["EVENT_TYPE_CD"].isin(["32", "33"])]
                for _, ev in transmissions.iterrows():
                    sent_date = ev["date"]
                    if timezone.is_naive(sent_date):
                        sent_date = timezone.make_aware(sent_date, timezone=local_tz)
                    dest = ev.get("next_établissement_postal")
                    later = sub[
                        (sub["établissement_postal"] == dest)
                        & (sub["date"] > sent_date)
                    ]
                    if later.empty and (timezone.now() - sent_date).days > 3:
                        alerts_to_create.append(("ALR001", dest, sent_date))

                receptions = sub[sub["EVENT_TYPE_CD"].isin(["34", "35"])]
                for _, ev in receptions.iterrows():
                    rec_date = ev["date"]
                    if timezone.is_naive(rec_date):
                        rec_date = timezone.make_aware(rec_date, timezone=local_tz)
                    loc = ev["établissement_postal"]
                    later = sub[
                        (sub["date"] > rec_date)
                        & (sub["EVENT_TYPE_CD"].isin(["36", "37"]))
                    ]
                    if (
                        later.empty
                        and (timezone.now() - rec_date).total_seconds() > 86400
                    ):
                        alerts_to_create.append(("ALR002", loc, rec_date))
                    later_full = sub[
                        (sub["date"] > rec_date)
                        & (sub["EVENT_TYPE_CD"].isin(["36", "37", "38"]))
                    ]
                    if later_full.empty and (timezone.now() - rec_date).days > 15:
                        alerts_to_create.append(("ALR003", loc, rec_date))

                hb_rows = sub[
                    sub["établissement_postal"].str.contains(
                        "Aéropostal", case=False, na=False
                    )
                ]
                for _, ev in hb_rows.iterrows():
                    sent = sub[
                        (sub["date"] > ev["date"])
                        & (sub["établissement_postal"] != ev["établissement_postal"])
                    ]
                    if sent.empty and (timezone.now() - ev["date"]).days >= 1:
                        alerts_to_create.append(
                            ("ALR004", ev["établissement_postal"], ev["date"])
                        )

                hb_to_cpx = sub[
                    sub["établissement_postal"].str.contains(
                        "Aéropostal", case=False, na=False
                    )
                    & sub["next_établissement_postal"].str.contains(
                        "Alger CPX", case=False, na=False
                    )
                ]
                for _, ev in hb_to_cpx.iterrows():
                    later = sub[
                        sub["établissement_postal"].str.contains(
                            "Alger CPX", case=False, na=False
                        )
                        & (sub["date"] > ev["date"])
                    ]
                    if later.empty and (timezone.now() - ev["date"]).days > 2:
                        alerts_to_create.append(("ALR005", "Alger CPX", ev["date"]))

                cpx_to_ctni = sub[
                    sub["établissement_postal"].str.contains(
                        "Alger CPX", case=False, na=False
                    )
                    & sub["next_établissement_postal"].str.contains(
                        "CTNI", case=False, na=False
                    )
                ]
                for _, ev in cpx_to_ctni.iterrows():
                    later = sub[
                        sub["établissement_postal"].str.contains(
                            "CTNI", case=False, na=False
                        )
                        & (sub["date"] > ev["date"])
                    ]
                    if later.empty and (timezone.now() - ev["date"]).days > 2:
                        alerts_to_create.append(("ALR006", "CTNI", ev["date"]))

                activity = sub[
                    sub["établissement_postal"].str.contains(
                        "CPX|CTNI", case=False, na=False
                    )
                ]
                if not activity.empty:
                    last_event_time = activity["date"].max()
                    if (timezone.now() - last_event_time).total_seconds() > 10800:
                        alerts_to_create.append(
                            (
                                "ALR007",
                                activity.iloc[-1]["établissement_postal"],
                                last_event_time,
                            )
                        )

                for _, ev in receptions.iterrows():
                    next_send = sub[
                        (sub["date"] > ev["date"])
                        & (sub["établissement_postal"] != ev["établissement_postal"])
                    ]
                    if next_send.empty and (timezone.now() - ev["date"]).days > 4:
                        alerts_to_create.append(
                            ("ALR008", ev["établissement_postal"], ev["date"])
                        )

                # --- Translate office_name to office_obj/state_obj and deduplicate ---
                for code, office_name, event_timestamp in alerts_to_create:
                    office_obj = (
                        office_map.get(office_name.lower()) if office_name else None
                    )
                    state_obj = office_obj.state if office_obj else None

                    # fallback: previous event's next_établissement_postal
                    if not office_obj:
                        prev_events = sub[sub["date"] < event_timestamp].sort_values(
                            "date", ascending=False
                        )
                        if not prev_events.empty:
                            fallback_office_name = prev_events.iloc[0].get(
                                "next_établissement_postal"
                            )
                            if fallback_office_name:
                                office_obj = office_map.get(
                                    fallback_office_name.lower()
                                )
                                state_obj = office_obj.state if office_obj else None

                    key = (
                        code,
                        event_timestamp,
                        office_obj.id if office_obj else None,
                        state_obj.id if state_obj else None,
                    )
                    if key in existing_alerts_set:
                        continue
                    all_alerts_to_create.append(
                        Alert(
                            alarm_code=code,
                            title=ALERT_DEFINITIONS[code]["title"],
                            trigger_condition=ALERT_DEFINITIONS[code][
                                "trigger_condition"
                            ],
                            severity=ALERT_DEFINITIONS[code]["severity"],
                            action_required=ALERT_DEFINITIONS[code]["action_required"],
                            office=office_obj,
                            state=state_obj,
                            timestamp=event_timestamp,
                        )
                    )
                    existing_alerts_set.add(key)

                # --- Prepare Package object ---
                package_obj = Package(
                    mailitm_fid=mailitm_fid,
                    country=sub.iloc[0].get("country"),
                    total_duration=sub.iloc[0].get("total_duration"),
                    status=status_val,
                    delivered_at=delivered_at,
                    failed_at=failed_at,
                    alert_after_success=alert_after_success,
                    failure_before_success_count=failure_before_success_count,
                    recovered_after_failure=recovered_after_failure,
                    flag_seized=flag_seized,
                    seized_at=seized_at,
                    exited_at=exited_at,
                    hold_duration=hold_duration,
                    alert_after_seizure=alert_after_seizure,
                    cities_after_failure_count=cities_after_failure_count,
                    last_known_location=last_known_location,
                    last_event_type_cd=last_event_type_cd,
                    last_event_timestamp=last_event_timestamp,
                )

                # Add to create list or update existing
                existing_pkg = existing_packages_map.get(mailitm_fid)
                if existing_pkg:
                    for field in package_obj._meta.get_fields():
                        if hasattr(package_obj, field.name):
                            setattr(
                                existing_pkg,
                                field.name,
                                getattr(package_obj, field.name),
                            )
                else:
                    package_objs.append(package_obj)

            # --- Bulk create/update packages ---
            if package_objs:
                Package.objects.bulk_create(
                    package_objs, batch_size=1000, ignore_conflicts=True
                )
                logger.info(f"Created {len(package_objs)} new packages.")

            if existing_packages_map:
                Package.objects.bulk_update(
                    list(existing_packages_map.values()),
                    fields=[
                        f.name
                        for f in Package._meta.get_fields()
                        if f.concrete and not f.many_to_many
                    ],
                    batch_size=1000,
                )
                logger.info(f"Updated {len(existing_packages_map)} existing packages.")

            # --- Bulk create alerts ---
            if all_alerts_to_create:
                Alert.objects.bulk_create(all_alerts_to_create, batch_size=1000)
                logger.info(f"Created {len(all_alerts_to_create)} alerts in bulk.")

            # --- Build transitions ---
            logger.info("Building transitions...")
            build_transitions(df_clean, df_etab)
            logger.info("Transitions built successfully.")

            logger.info("UploadCSVAndSave completed successfully.")
            return Response(
                {
                    "status": "success",
                    "events_saved": len(event_objs),
                    "packages_saved": len(unique_ids),
                    "alerts_created": len(all_alerts_to_create),
                },
                status=201,
            )

        except Exception as e:
            logger.exception("Error while processing uploaded CSV file.")
            return Response({"error": str(e)}, status=500)


# ----------------------------
# Package stats API
# ----------------------------
class PackageStatsAPIView(APIView):
    def get(self, request, format=None):
        qs = Package.objects.all()
        total = qs.count()

        counts = qs.aggregate(
            success_count=Count("id", filter=Q(status="success")),
            failure_count=Count("id", filter=Q(status="failure")),
            in_process_count=Count("id", filter=Q(status="in_process")),
        )

        n_success = counts["success_count"]
        n_failure = counts["failure_count"]
        n_in_process = counts["in_process_count"]
        n_done = n_success + n_failure

        # ----------------------------
        # On-time delivered packages
        # ----------------------------
        on_time_count = qs.filter(
            status="success",
            total_duration__isnull=False,
            total_duration__lte=pd.Timedelta(days=SLA_DAYS),
        ).count()

        # ----------------------------
        # Delivery duration metrics
        # ----------------------------
        delivered_qs = qs.filter(status="success", total_duration__isnull=False)
        durations = delivered_qs.values_list("total_duration", flat=True)
        durations_filtered = [
            d
            for d in durations
            if pd.Timedelta(0) <= d <= pd.Timedelta(days=MAX_ALLOWED_DAYS)
        ]

        if durations_filtered:
            durations_series = pd.Series(durations_filtered)
            avg_duration_str = str(durations_series.mean())
            median_duration_str = str(durations_series.median())
        else:
            avg_duration_str = None
            median_duration_str = None

        # ----------------------------
        # Recovery metrics (success after failure)
        # ----------------------------
        recovered_qs = qs.filter(recovered_after_failure=True)
        recovered_after_failure_count = recovered_qs.count()

        recovery_rate_success = (
            round(recovered_after_failure_count / n_success, 4) if n_success else 0
        )

        avg_failures_before_success = (
            round(
                recovered_qs.aggregate(
                    total_failures=Sum("failure_before_success_count")
                )["total_failures"]
                / recovered_after_failure_count,
                2,
            )
            if recovered_after_failure_count
            else 0
        )

        # ----------------------------
        # Post-failure movement metrics (new)
        # ----------------------------
        failed_qs = qs.filter(status="failure")
        failed_count = failed_qs.count()

        if failed_count:
            agg_data = failed_qs.aggregate(
                total_cities=Sum("cities_after_failure_count"),
                max_cities=Max("cities_after_failure_count"),
            )

            total_cities_after_failure = agg_data["total_cities"] or 0
            max_cities_after_failure = agg_data["max_cities"] or 0
            avg_cities_after_failure = (
                round(total_cities_after_failure / failed_count, 2)
                if failed_count
                else 0
            )

            packages_with_post_failure_movement = failed_qs.filter(
                cities_after_failure_count__gt=0
            ).count()
            pct_with_post_failure_movement = round(
                packages_with_post_failure_movement / failed_count, 4
            )
        else:
            total_cities_after_failure = 0
            max_cities_after_failure = 0
            avg_cities_after_failure = 0
            packages_with_post_failure_movement = 0
            pct_with_post_failure_movement = 0

        # ----------------------------
        # Customs (douane) KPIs
        # ----------------------------
        customs_in_qs = qs.filter(flag_seized=True)
        customs_out_qs = qs.filter(
            flag_seized=False, seized_at__isnull=False, exited_at__isnull=False
        )
        customs_alert_qs = qs.filter(alert_after_seizure=True)

        in_customs_count = customs_in_qs.count()
        exited_customs_count = customs_out_qs.count()
        customs_alert_count = customs_alert_qs.count()

        # Average customs hold duration (only for exited)
        hold_durations = customs_out_qs.values_list("hold_duration", flat=True)
        valid_holds = [
            d for d in hold_durations if d is not None and d.total_seconds() > 0
        ]

        if valid_holds:
            avg_hold_duration = str(pd.Series(valid_holds).mean())
            median_hold_duration = str(pd.Series(valid_holds).median())
        else:
            avg_hold_duration = None
            median_hold_duration = None
        # ----------------------------
        # Save to model
        # ----------------------------
        Dashboard.objects.create(
            pre_arrived_dispatches_count=0,  # placeholder
            items_delivered=n_success,
            items_delivered_after_one_fail=recovered_after_failure_count,
            undelivered_items=n_failure,
            delivery_rate=round((n_success / total) * 100, 2) if total else 0,
            on_time_delivery_rate=round((on_time_count / total) * 100, 2)
            if total
            else 0,
            items_exceeding_holding_time=0,
            items_blocked_in_customs=in_customs_count,
            returned_items=0,
            consolidation_time=str(avg_failures_before_success),
            end_to_end_transit_time_average=avg_duration_str or "",
            shipment_consolidation_time=avg_hold_duration or "",
            unscanned_items=0,
        )

        # ----------------------------
        # Response
        # ----------------------------
        return Response(
            {
                # --- General package stats ---
                "total_packages": total,
                "success_count": n_success,
                "failure_count": n_failure,
                "in_process_count": n_in_process,
                "done_count": n_done,
                "success_rate_all": round(n_success / total, 4) if total else 0,
                "failure_rate_all": round(n_failure / total, 4) if total else 0,
                "success_rate_done": round(n_success / n_done, 4) if n_done else 0,
                "failure_rate_done": round(n_failure / n_done, 4) if n_done else 0,
                "on_time_delivery_rate_all": round(on_time_count / total, 4)
                if total
                else 0,
                "on_time_delivery_rate_delivered_only": round(
                    on_time_count / n_success, 4
                )
                if n_success
                else 0,
                "average_delivery_duration": avg_duration_str,
                "median_delivery_duration": median_duration_str,
                # --- Recovery KPIs ---
                "recovered_after_failure_count": recovered_after_failure_count,
                "recovery_rate_success": recovery_rate_success,
                "avg_failures_before_success": avg_failures_before_success,
                # --- Customs KPIs ---
                "in_customs_count": in_customs_count,
                "exited_customs_count": exited_customs_count,
                "customs_alert_count": customs_alert_count,
                "avg_customs_hold_duration": avg_hold_duration,
                "median_customs_hold_duration": median_hold_duration,
                "total_cities_after_failure": total_cities_after_failure,
                "avg_cities_after_failure": avg_cities_after_failure,
                "max_cities_after_failure": max_cities_after_failure,
                "packages_with_post_failure_movement": packages_with_post_failure_movement,
                "pct_with_post_failure_movement": pct_with_post_failure_movement,
            },
            status=status.HTTP_200_OK,
        )


class TransitionReportAPIView(APIView):
    def get(self, request, format=None):
        qs = PackageTransition.objects.all()
        total = qs.count()

        late_qs = qs.filter(late=True)
        late_count = late_qs.count()

        # Unique packages with at least one late transition
        unique_late_packages = (
            late_qs.values_list("package_id", flat=True).distinct().count()
        )

        # Avoid division by zero
        late_rate = round(late_count / total, 4) if total else 0

        # Sample transitions (first 10)
        sample_data = [
            {
                "package": t.package.mailitm_fid,
                "origin_upw": t.origin_upw,
                "dest_upw": t.dest_upw,
                "actual_duration": str(t.actual_duration),
                "allowed_duration": str(t.allowed_duration)
                if t.allowed_duration
                else None,
                "late": t.late,
            }
            for t in qs.select_related("package")[:10]
        ]

        return Response(
            {
                "total_transitions": total,
                "late_transitions": late_count,
                "unique_packages_with_late_transitions": unique_late_packages,
                "late_rate": late_rate,
                "sample_transitions": sample_data,
            },
            status=status.HTTP_200_OK,
        )
