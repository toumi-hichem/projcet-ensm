import pandas as pd
import numpy as np
import io
import time
import traceback
import os
import logging
from django.utils import timezone
from core.models import BagUploadMetaData

logger = logging.getLogger(__name__)


def clean_bag(raw_csv_file):
    """Clean and preprocess uploaded bag (receptacle) data CSV. Args: raw_csv_file (InMemoryUploadedFile or file-like): Uploaded CSV file. Returns: pd.DataFrame: Cleaned and structured bag dataset."""
    # --- Read CSV safely ---
    try:
        text_stream = io.TextIOWrapper(raw_csv_file, encoding="utf-8")
        df = pd.read_csv(text_stream, delimiter=";", dtype=str)
    except Exception as e:
        raise ValueError(f"Error reading CSV file: {e}")
    # --- Basic cleaning ---
    df["country"] = df["RECPTCL_FID"].str[:2]
    df = df[df["LOCAL_EVENT_TYPE_NM"] != "Receptacle evaluated for sampling"].copy()
    # --- Parse dates ---
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    # --- Sort and compute durations ---
    df = df.sort_values(["RECPTCL_FID", "date"]).reset_index(drop=True)
    df["duration_to_next_step"] = (
        df.groupby("RECPTCL_FID")["date"].shift(-1) - df["date"]
    )
    first_date = df.groupby("RECPTCL_FID")["date"].transform("first")
    last_date = df.groupby("RECPTCL_FID")["date"].transform("last")
    df["total_duration"] = last_date - first_date
    # --- Postal fixes ---
    df["etablissement_postal"] = df["etablissement_postal"].replace("", np.nan)
    mask = df["EVENT_TYPECD"].eq(107) & df["etablissement_postal"].isna()
    df.loc[mask, "etablissement_postal"] = df.loc[
        mask, "country"
    ]  # --- Deduplicate ---
    df = df.drop_duplicates(
        subset=["RECPTCL_FID", "date", "EVENT_TYPECD", "etablissement_postal"],
        keep="first",
    )
    # --- Keep only relevant columns ---
    keep_cols = [
        "RECPTCL_FID",
        "date",
        "EVENT_TYPECD",
        "etablissement_postal",
        "nextetablissement_postal",
        "country",
        "duration_to_next_step",
        "total_duration",
    ]
    df = df[[c for c in keep_cols if c in df.columns]]
    # --- Final cleanup ---
    df.replace([pd.NaT, pd.NA, np.nan, np.inf, -np.inf], None, inplace=True)
    print(" BAG DATA CLEANED SUCCESSFULLY ")
    print(f"Rows: {len(df)} | Columns: {df.columns.tolist()}")
    return df


def clean_bag_data(raw_csv_file):
    """
    Clean uploaded bag (receptacle) CSV and extract metadata for analysis/logging.

    Returns:
        tuple[pd.DataFrame, dict]: (cleaned DataFrame, metadata dict)
    """
    start_time = time.time()
    metadata = {"errors": [], "warnings": [], "cleaning_summary": {}}

    try:
        # --- 1️⃣ Read CSV safely ---
        text_stream = io.TextIOWrapper(raw_csv_file, encoding="utf-8")
        try:
            df_raw = pd.read_csv(text_stream, delimiter=";", dtype=str)
        except Exception as e:
            metadata["errors"].append(f"CSV parsing error: {str(e)}")
            metadata["traceback"] = traceback.format_exc()
            return pd.DataFrame(), metadata

        metadata["raw_rows"] = len(df_raw)
        metadata["raw_columns"] = list(df_raw.columns)

        # --- 2️⃣ Basic validation ---
        required_columns = {"RECPTCL_FID", "date"}
        missing_required = required_columns - set(df_raw.columns)
        if missing_required:
            metadata["errors"].append(
                f"Missing required columns: {', '.join(missing_required)}"
            )
            return df_raw, metadata

        # --- 3️⃣ Basic cleaning ---
        df_raw["country"] = df_raw["RECPTCL_FID"].astype(str).str[:2]
        if "LOCAL_EVENT_TYPE_NM" in df_raw.columns:
            before = len(df_raw)
            df_raw = df_raw[
                df_raw["LOCAL_EVENT_TYPE_NM"] != "Receptacle evaluated for sampling"
            ].copy()
            removed = before - len(df_raw)
            if removed > 0:
                metadata["warnings"].append(
                    f"Removed {removed} rows with sampling evaluation events"
                )

        # --- 4️⃣ Date parsing ---
        df_raw["date"] = pd.to_datetime(df_raw["date"], errors="coerce")
        if df_raw["date"].isna().all():
            metadata["errors"].append("All 'date' values could not be parsed.")
            return df_raw, metadata

        # --- 5️⃣ Sort and duration calculations ---
        df = df_raw.sort_values(["RECPTCL_FID", "date"]).reset_index(drop=True)
        df["duration_to_next_step"] = (
            df.groupby("RECPTCL_FID")["date"].shift(-1) - df["date"]
        )
        first_date = df.groupby("RECPTCL_FID")["date"].transform("first")
        last_date = df.groupby("RECPTCL_FID")["date"].transform("last")
        df["total_duration"] = last_date - first_date

        # --- 6️⃣ Postal data cleanup ---
        if "etablissement_postal" in df.columns:
            df["etablissement_postal"] = df["etablissement_postal"].replace("", np.nan)
            mask = df["EVENT_TYPECD"].eq("107") & df["etablissement_postal"].isna()
            df.loc[mask, "etablissement_postal"] = df.loc[mask, "country"]

        # --- 7️⃣ Deduplication ---
        before_dedup = len(df)
        df = df.drop_duplicates(
            subset=["RECPTCL_FID", "date", "EVENT_TYPECD", "etablissement_postal"],
            keep="first",
        )
        removed_duplicates = before_dedup - len(df)
        if removed_duplicates > 0:
            metadata["warnings"].append(f"Removed {removed_duplicates} duplicate rows")

        # --- 8️⃣ Keep only relevant columns ---
        keep_cols = [
            "RECPTCL_FID",
            "date",
            "EVENT_TYPECD",
            "etablissement_postal",
            "nextetablissement_postal",
            "country",
            "duration_to_next_step",
            "total_duration",
        ]
        df = df[[c for c in keep_cols if c in df.columns]]

        # --- 9️⃣ Replace NaN with None ---
        df.replace([pd.NaT, pd.NA, np.nan, np.inf, -np.inf], None, inplace=True)

        # --- 🔟 Metadata statistics ---
        n_rows = len(df)
        n_columns = len(df.columns)
        unique_bags = int(df["RECPTCL_FID"].nunique())
        unique_event_types = int(df["EVENT_TYPECD"].nunique())
        top_event_types = df["EVENT_TYPECD"].value_counts().head(10).to_dict()

        avg_step_duration = df["duration_to_next_step"].mean()
        avg_total_duration = df["total_duration"].mean()
        earliest_date = df["date"].min()
        latest_date = df["date"].max()
        time_range_days = (
            (latest_date - earliest_date).days
            if pd.notna(earliest_date) and pd.notna(latest_date)
            else None
        )

        metadata.update(
            {
                "n_rows": n_rows,
                "n_columns": n_columns,
                "columns": list(df.columns),
                "unique_bags_count": unique_bags,
                "unique_event_types": unique_event_types,
                "top_event_types": top_event_types,
                "earliest_date": earliest_date,
                "latest_date": latest_date,
                "time_range_days": time_range_days,
                "avg_step_duration_seconds": (
                    avg_step_duration.total_seconds()
                    if pd.notna(avg_step_duration)
                    else None
                ),
                "avg_total_duration_seconds": (
                    avg_total_duration.total_seconds()
                    if pd.notna(avg_total_duration)
                    else None
                ),
                "rows_removed_due_to_duplicates": removed_duplicates,
                "missing_values_by_column": df.isna().sum().to_dict(),
                "missing_values_count": int(df.isna().sum().sum()),
                "cleaning_time_seconds": round(time.time() - start_time, 3),
            }
        )

    except Exception as e:
        metadata["errors"].append(f"Unexpected error: {str(e)}")
        metadata["traceback"] = traceback.format_exc()
        logger.exception("Error cleaning bag data")

    return df if "df" in locals() else pd.DataFrame(), metadata


def get_bag_upload_metadata(df, start_time):
    """Generate metadata dictionary from a cleaned bag DataFrame."""
    metadata = {}

    try:
        metadata["n_rows"] = len(df)
        metadata["n_columns"] = len(df.columns)
        metadata["columns"] = list(df.columns)
        metadata["missing_values_count"] = int(df.isna().sum().sum())
        metadata["missing_values_by_column"] = df.isna().sum().to_dict()

        # Bag and event type stats
        metadata["unique_bags_count"] = int(df["RECPTCL_FID"].nunique())
        metadata["unique_event_types"] = int(df["EVENT_TYPECD"].nunique())
        metadata["top_event_types"] = (
            df["EVENT_TYPECD"].value_counts().head(10).to_dict()
        )

        # Date range
        metadata["earliest_date"] = pd.to_datetime(df["date"], errors="coerce").min()
        metadata["latest_date"] = pd.to_datetime(df["date"], errors="coerce").max()

        if pd.notna(metadata["earliest_date"]) and pd.notna(metadata["latest_date"]):
            metadata["time_range_days"] = (
                metadata["latest_date"] - metadata["earliest_date"]
            ).days
        else:
            metadata["time_range_days"] = None

        # --- FIX: ensure duration columns are numeric (seconds) ---
        for col in ["duration_to_next_step", "total_duration"]:
            if col in df.columns:
                df[col] = pd.to_timedelta(df[col], errors="coerce").dt.total_seconds()

        # Compute averages safely
        avg_step_duration = df["duration_to_next_step"].mean(skipna=True)
        avg_total_duration = df["total_duration"].mean(skipna=True)

        metadata["avg_step_duration_seconds"] = (
            float(avg_step_duration) if pd.notna(avg_step_duration) else None
        )
        metadata["avg_total_duration_seconds"] = (
            float(avg_total_duration) if pd.notna(avg_total_duration) else None
        )

        # Cleaning time
        metadata["cleaning_time_seconds"] = round(time.time() - start_time, 3)

        logger.info("✅ Bag metadata generated successfully")
        logger.debug(f"📊 Metadata summary: {metadata}")

    except Exception:
        logger.exception("❌ Error generating bag metadata")
        metadata["error"] = "Error while generating bag metadata"
        metadata["traceback"] = traceback.format_exc()

    return metadata


def save_bag_upload_metadata(uploaded_file, metadata, extra_stats=None):
    """
    Save BagUploadMetaData entry from given file and metadata.
    """
    logger.info("Saving Bag upload metadata...")

    data = {
        "filename": getattr(uploaded_file, "name", "unknown.csv"),
        "file_size_bytes": getattr(uploaded_file, "size", 0),
        "file_type": os.path.splitext(getattr(uploaded_file, "name", ""))[-1].replace(
            ".", ""
        )
        or "csv",
        "upload_timestamp": timezone.now(),
    }

    # Map metadata fields
    for key in [
        "n_rows",
        "n_columns",
        "columns",
        "missing_values_count",
        "missing_values_by_column",
        "unique_bags_count",
        "unique_event_types",
        "top_event_types",
        "earliest_date",
        "latest_date",
        "time_range_days",
        "cleaning_time_seconds",
        "avg_step_duration_seconds",
        "avg_total_duration_seconds",
    ]:
        if key in metadata:
            data[key] = metadata[key]

    # Add optional stats
    valid_fields = {f.name for f in BagUploadMetaData._meta.fields}
    if extra_stats:
        for k, v in extra_stats.items():
            if k in valid_fields:
                data[k] = v

    # Default counters
    for key in ["events_inserted", "bags_created", "bags_updated"]:
        if key in valid_fields:
            data.setdefault(key, 0)

    record = BagUploadMetaData.objects.create(**data)
    logger.info(f"✅ Saved BagUploadMetaData id={record.id} for {data['filename']}")
    return record
