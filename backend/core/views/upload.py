import pandas as pd
from django.db.models import Q, Count
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Package, PackageEvent, PackageTransition
from core.utils.cleaning import clean_package_data, sanitize_for_json
from core.utils.transitions_helper import build_transitions, df_etab

MAX_ALLOWED_DAYS = 365 * 5  # Max 5 years
SLA_DAYS = 15

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

                success_rows = sub[sub["EVENT_TYPE_CD"] == "37"]
                failure_rows = sub[sub["EVENT_TYPE_CD"] == "36"]

                if not success_rows.empty:
                    status_val = "success"
                    delivered_at = success_rows.iloc[0]["date"]
                    if success_rows.index[0] < sub.index[-1]:
                        alert_after_success = True
                elif not failure_rows.empty:
                    status_val = "failure"
                    failed_at = failure_rows.iloc[0]["date"]

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

            Package.objects.bulk_update(
                existing_packages,
                [
                    "country",
                    "total_duration",
                    "status",
                    "delivered_at",
                    "failed_at",
                    "alert_after_success",
                ],
                batch_size=1000,
            )

            # --- Build transitions (on-demand) ---
            build_transitions(df_clean, df_etab)

            # --- Sample events for response ---
            sample_events = sanitize_for_json(df_clean[event_fields].head(5)).to_dict(
                orient="records"
            )
            sample_packages = [
                {
                    "MAILITM_FID": p.mailitm_fid,
                    "country": p.country,
                    "total_duration": (
                        str(p.total_duration) if p.total_duration else None
                    ),
                    "status": p.status,
                    "delivered_at": (
                        p.delivered_at.isoformat() if p.delivered_at else None
                    ),
                    "failed_at": p.failed_at.isoformat() if p.failed_at else None,
                    "alert_after_success": p.alert_after_success,
                }
                for p in package_objs[:5]
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

        # On-time delivered packages
        on_time_count = qs.filter(
            status="success",
            total_duration__isnull=False,
            total_duration__lte=pd.Timedelta(days=SLA_DAYS),
        ).count()

        # Average & median delivery duration
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

        return Response(
            {
                "total_packages": total,
                "success_count": n_success,
                "failure_count": n_failure,
                "in_process_count": n_in_process,
                "done_count": n_done,
                "success_rate_all": round(n_success / total, 4) if total else 0,
                "failure_rate_all": round(n_failure / total, 4) if total else 0,
                "success_rate_done": round(n_success / n_done, 4) if n_done else 0,
                "failure_rate_done": round(n_failure / n_done, 4) if n_done else 0,
                "on_time_delivery_rate_all": (
                    round(on_time_count / total, 4) if total else 0
                ),
                "on_time_delivery_rate_delivered_only": (
                    round(on_time_count / n_success, 4) if n_success else 0
                ),
                "average_delivery_duration": avg_duration_str,
                "median_delivery_duration": median_duration_str,
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
                "allowed_duration": (
                    str(t.allowed_duration) if t.allowed_duration else None
                ),
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
