import pandas as pd
from django.db.models import Q, Count, Sum, Max
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Package, PackageEvent, PackageTransition, Dashboard
from core.utils.cleaning import clean_package_data, sanitize_for_json
from core.utils.transitions_helper import build_transitions, df_etab

MAX_ALLOWED_DAYS = 365 * 5  # Max 5 years
SLA_DAYS = 15

# ----------------------------
# Upload CSV and save events + packages
# ----------------------------


# ----------------------------
# Upload CSV and save events + packages
# ----------------------------
class UploadCSVAndSave(APIView):
    def post(self, request, format=None):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # --- Clean CSV data ---
            df_clean = clean_package_data(file_obj)

            # --- Bulk insert PackageEvents ---
            event_fields = [
                "MAILITM_FID",
                "date",
                "EVENT_TYPE_CD",
                "établissement_postal",
                "next_établissement_postal",
                "duration_to_next_step",
            ]

            # Convert 'date' to datetime just once
            df_clean["date"] = pd.to_datetime(df_clean["date"], errors="coerce")

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

            # --- Bulk insert/update Packages ---
            unique_ids = df_clean["MAILITM_FID"].unique()
            package_objs = []

            for mailitm_fid in unique_ids:
                sub = df_clean[df_clean["MAILITM_FID"] == mailitm_fid].sort_values(
                    "date"
                )
                status_val = "in_process"
                delivered_at = None
                failed_at = None
                alert_after_success = False
                last_known_location = sub.iloc[-1].get("établissement_postal")

                customs_codes = ["4", "6", "7", "31", "38"]
                customs_rows = sub[
                    sub["EVENT_TYPE_CD"].isin(customs_codes)
                ].sort_values("date")

                flag_seized = False
                seized_at = None
                exited_at = None
                hold_duration = None
                alert_after_seizure = False
                cities_after_failure_count = 0

                if not customs_rows.empty:
                    latest_event = customs_rows.iloc[-1]
                    latest_code = latest_event["EVENT_TYPE_CD"]
                    latest_date = latest_event["date"]

                    # Customs entry / hold events → seized
                    if latest_code in ["4", "6", "31"]:
                        flag_seized = True
                        seized_at = latest_date

                        # Check if new events occur after seized_at without exit
                        later_events = sub[sub["date"] > seized_at]
                        if not later_events.empty and not any(
                            later_events["EVENT_TYPE_CD"].isin(["7", "38"])
                        ):
                            alert_after_seizure = True

                    # Customs exit events → released
                    elif latest_code in ["7", "38"]:
                        flag_seized = False
                        exited_at = latest_date

                        # Find previous seizure to compute duration
                        prev_seizure = customs_rows[
                            customs_rows["EVENT_TYPE_CD"].isin(["4", "6", "31"])
                        ]
                        if not prev_seizure.empty:
                            seized_at = prev_seizure.iloc[-1]["date"]
                            hold_duration = exited_at - seized_at

                # --- end customs logic ---

                success_rows = sub[sub["EVENT_TYPE_CD"] == "37"]
                failure_rows = sub[sub["EVENT_TYPE_CD"] == "36"]

                # --- New tracking variables ---
                failure_before_success_count = 0
                recovered_after_failure = False

                if not success_rows.empty:
                    status_val = "success"
                    delivered_at = success_rows.iloc[0]["date"]

                    # Find all failures that occurred *before* the first success
                    first_success_date = delivered_at
                    failures_before = failure_rows[
                        failure_rows["date"] < first_success_date
                    ]
                    failure_before_success_count = len(failures_before)
                    recovered_after_failure = failure_before_success_count > 0

                    # You already have this logic to catch weird cases after success
                    if success_rows.index[0] < sub.index[-1]:
                        alert_after_success = True

                elif not failure_rows.empty:
                    status_val = "failure"
                    failed_at = failure_rows.iloc[0]["date"]

                    # --- Count cities visited after last failure ---
                    last_failure_index = sub[sub["EVENT_TYPE_CD"] == "36"].index[-1]
                    after_failure = sub.loc[last_failure_index + 1 :]
                    cities_after_failure_count = (
                        after_failure["EVENT_TYPE_CD"] == "32"
                    ).sum()
                else:
                    cities_after_failure_count = 0

                total_duration = sub.iloc[0].get("total_duration")
                country = sub.iloc[0].get("country")

                package_objs.append(
                    Package(
                        mailitm_fid=mailitm_fid,
                        country=country,
                        total_duration=total_duration,
                        status=status_val,
                        delivered_at=delivered_at,
                        failed_at=failed_at,
                        alert_after_success=alert_after_success,
                        # --- new fields added here ---
                        failure_before_success_count=failure_before_success_count,
                        recovered_after_failure=recovered_after_failure,
                        flag_seized=flag_seized,
                        seized_at=seized_at,
                        exited_at=exited_at,
                        hold_duration=hold_duration,
                        alert_after_seizure=alert_after_seizure,
                        cities_after_failure_count=cities_after_failure_count,
                        last_known_location=last_known_location,
                    )
                )

            # Bulk create
            Package.objects.bulk_create(
                package_objs, batch_size=1000, ignore_conflicts=True
            )

            # Bulk update existing
            existing_packages = Package.objects.filter(mailitm_fid__in=unique_ids)
            update_map = {p.mailitm_fid: p for p in package_objs}

            for pkg in existing_packages:
                new_pkg = update_map.get(pkg.mailitm_fid)
                if new_pkg:
                    pkg.country = new_pkg.country
                    pkg.total_duration = new_pkg.total_duration
                    pkg.status = new_pkg.status
                    pkg.delivered_at = new_pkg.delivered_at
                    pkg.failed_at = new_pkg.failed_at
                    pkg.alert_after_success = new_pkg.alert_after_success

                    # --- new recovery fields ---
                    pkg.failure_before_success_count = (
                        new_pkg.failure_before_success_count
                    )
                    pkg.recovered_after_failure = new_pkg.recovered_after_failure

                    # --- new customs fields ---
                    pkg.flag_seized = new_pkg.flag_seized
                    pkg.seized_at = new_pkg.seized_at
                    pkg.exited_at = new_pkg.exited_at
                    pkg.hold_duration = new_pkg.hold_duration
                    pkg.alert_after_seizure = new_pkg.alert_after_seizure
                    pkg.cities_after_failure_count = new_pkg.cities_after_failure_count
                    pkg.last_known_location = new_pkg.last_known_location

            # ✅ Final bulk update
            Package.objects.bulk_update(
                existing_packages,
                [
                    "country",
                    "total_duration",
                    "status",
                    "delivered_at",
                    "failed_at",
                    "alert_after_success",
                    "failure_before_success_count",
                    "recovered_after_failure",
                    "flag_seized",
                    "seized_at",
                    "exited_at",
                    "hold_duration",
                    "alert_after_seizure",
                    "cities_after_failure_count",
                    "last_known_location",
                ],
                batch_size=1000,
            )

            # --- Build transitions (on-demand) ---
            build_transitions(df_clean, df_etab)

            sample_events = sanitize_for_json(df_clean[event_fields].head(15)).to_dict(
                orient="records"
            )

            # --- Sample events for response ---
            sample_packages = [
                {
                    "MAILITM_FID": p.mailitm_fid,
                    "country": p.country,
                    "total_duration": str(p.total_duration)
                    if p.total_duration
                    else None,
                    "status": p.status,
                    "delivered_at": p.delivered_at.isoformat()
                    if p.delivered_at
                    else None,
                    "failed_at": p.failed_at.isoformat() if p.failed_at else None,
                    "alert_after_success": p.alert_after_success,
                    "failure_before_success_count": p.failure_before_success_count,
                    "recovered_after_failure": p.recovered_after_failure,
                    "flag_seized": p.flag_seized,
                    "seized_at": p.seized_at.isoformat() if p.seized_at else None,
                    "exited_at": p.exited_at.isoformat() if p.exited_at else None,
                    "hold_duration": str(p.hold_duration) if p.hold_duration else None,
                    "alert_after_seizure": p.alert_after_seizure,
                    "cities_after_failure_count": p.cities_after_failure_count,
                    "last_known_location": p.last_known_location,
                }
                for p in package_objs[:15]  # ✅ now showing 15 packages instead of 5
            ]

            return Response(
                {
                    "status": "success",
                    "events_saved": len(event_objs),
                    "packages_saved": len(package_objs),
                    "sample_events": sample_events,
                    "sample_packages": sample_packages,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
