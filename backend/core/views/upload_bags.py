from datetime import timedelta
import logging
import time
import pandas as pd
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Bag, BagEvent
from core.utils.clean_bag import (
    clean_bag_data,
    get_bag_upload_metadata,
    save_bag_upload_metadata,
    clean_bag,
)


# ✅ Use module-level logger
logger = logging.getLogger(__name__)


def to_timedelta(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (float, int)):
        return timedelta(seconds=float(val))
    if isinstance(val, str):
        try:
            return pd.to_timedelta(val).to_pytimedelta()
        except Exception:
            return None
    if isinstance(val, pd.Timedelta):
        return val.to_pytimedelta()
    return val  # already timedelta


def format_duration(value):
    if pd.isna(value) or value is None:
        return None
    if isinstance(value, (int, float)):
        seconds = float(value)
    else:
        seconds = value.total_seconds()
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{days} days {hours}h {minutes}m"


def safe_make_aware(dt):
    """Avoid 'naive datetime' warnings by applying current timezone safely."""
    if pd.isna(dt) or dt is None:
        return None
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt


class UploadBagsCSV(APIView):
    def post(self, request, format=None):
        logger.info("🟦 Starting bag CSV upload request")

        file_obj = request.FILES.get("file")
        if not file_obj:
            logger.warning("⚠️ No file provided in upload request")
            return Response(
                {"error": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # --- Step 1: Clean uploaded data ---
            logger.debug("Cleaning uploaded bag data...")

            start_time = time.time()
            df_clean = clean_bag(file_obj)
            metadata = get_bag_upload_metadata(df_clean, start_time)

            logger.info(f"✅ Cleaned CSV: {len(df_clean)} rows")

            # Convert date fields
            logger.debug("Parsing and localizing date fields...")
            df_clean["date"] = pd.to_datetime(df_clean["date"], errors="coerce")
            df_clean["date"] = df_clean["date"].apply(safe_make_aware)

            # --- Step 2: Prepare BagEvent objects ---
            event_fields = [
                "RECPTCL_FID",
                "date",
                "EVENT_TYPECD",
                "etablissement_postal",
                "nextetablissement_postal",
                "country",
                "duration_to_next_step",
                "total_duration",
            ]
            logger.debug("Constructing BagEvent objects...")

            event_objs = []
            for _, row in df_clean[event_fields].iterrows():
                event_objs.append(
                    BagEvent(
                        receptacle_fid=row["RECPTCL_FID"],
                        date=row["date"],
                        event_typecd=row.get("EVENT_TYPECD"),
                        etablissement_postal=row.get("etablissement_postal"),
                        nextetablissement_postal=row.get("nextetablissement_postal"),
                        country=row.get("country"),
                        duration_to_next_step=to_timedelta(
                            row.get("duration_to_next_step")
                        ),
                        total_duration=to_timedelta(row.get("total_duration")),
                    )
                )
            logger.info(f"Prepared {len(event_objs)} BagEvent records")

            # --- Step 3: Bulk insert BagEvents ---
            batch_size = 500
            for i in range(0, len(event_objs), batch_size):
                BagEvent.objects.bulk_create(
                    event_objs[i : i + batch_size], ignore_conflicts=True
                )
            logger.info(f"✅ Inserted {len(event_objs)} BagEvent records")

            # --- Step 4: Aggregate Bag data ---
            logger.debug("Aggregating Bag data per receptacle...")
            bag_objs = []
            for recptcl, group in df_clean.groupby("RECPTCL_FID"):
                group_sorted = group.sort_values("date")
                first_date = safe_make_aware(group_sorted["date"].min())
                last_date = safe_make_aware(group_sorted["date"].max())
                total_duration = to_timedelta(group_sorted["total_duration"].iloc[0])

                country = group_sorted["country"].iloc[0]
                events_count = len(group_sorted)
                last_location = (
                    group_sorted["etablissement_postal"].dropna().iloc[-1]
                    if group_sorted["etablissement_postal"].notna().any()
                    else None
                )

                bag_objs.append(
                    Bag(
                        receptacle_fid=recptcl,
                        country=country,
                        total_duration=total_duration,
                        first_event_date=first_date,
                        last_event_date=last_date,
                        last_known_location=last_location,
                        events_count=events_count,
                    )
                )

            logger.info(f"Prepared {len(bag_objs)} Bag records")

            # --- Step 5: Bulk insert Bags ---
            for i in range(0, len(bag_objs), batch_size):
                Bag.objects.bulk_create(
                    bag_objs[i : i + batch_size], ignore_conflicts=True
                )
            logger.info(f"✅ Inserted {len(bag_objs)} Bag records")

            # --- Step 6: Build response preview ---
            sample_events = [
                {
                    "RECPTCL_FID": row["RECPTCL_FID"],
                    "date": str(row["date"]),
                    "EVENT_TYPECD": row["EVENT_TYPECD"],
                    "etablissement_postal": row["etablissement_postal"],
                    "nextetablissement_postal": row["nextetablissement_postal"],
                    "country": row["country"],
                    "duration_to_next_step": format_duration(
                        row["duration_to_next_step"]
                    ),
                    "total_duration": format_duration(row["total_duration"]),
                }
                for _, row in df_clean.head(10).iterrows()
            ]

            sample_bags = [
                {
                    "receptacle_fid": b.receptacle_fid,
                    "country": b.country,
                    "total_duration": format_duration(b.total_duration),
                    "first_event_date": b.first_event_date.isoformat()
                    if b.first_event_date
                    else None,
                    "last_event_date": b.last_event_date.isoformat()
                    if b.last_event_date
                    else None,
                    "last_known_location": b.last_known_location,
                    "events_count": b.events_count,
                }
                for b in bag_objs[:10]
            ]

            extra_stats = {
                "events_inserted": len(event_objs),
                "bags_created": len(bag_objs),
            }

            save_bag_upload_metadata(file_obj, metadata, extra_stats)

            logger.info("✅ Bag upload completed successfully")

            return Response(
                {
                    "status": "success",
                    "events_saved": len(event_objs),
                    "bags_saved": len(bag_objs),
                    "sample_events": sample_events,
                    "sample_bags": sample_bags,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.exception("❌ Error while processing uploaded bag CSV")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
