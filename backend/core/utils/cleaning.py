import pandas as pd
import io
import time
import traceback
from core.models import UploadMetaData
from django.utils import timezone
import os


def clean_package_data(raw_csv_file):
    start_time = time.time()
    metadata = {
        "errors": [],
        "warnings": [],
        "cleaning_summary": {},
    }

    try:
        # --- 1️⃣ Read CSV safely ---
        text_stream = io.TextIOWrapper(raw_csv_file, encoding="utf-8")
        try:
            df_raw = pd.read_csv(text_stream, sep=",", dtype=str)
        except Exception as e:
            metadata["errors"].append(f"CSV parsing error: {str(e)}")
            metadata["traceback"] = traceback.format_exc()
            return pd.DataFrame(), metadata

        initial_rows = len(df_raw)
        metadata["raw_rows"] = initial_rows
        metadata["raw_columns"] = list(df_raw.columns)

        # --- 2️⃣ Basic validation ---
        required_columns = {"MAILITM_FID", "date"}
        missing_required = required_columns - set(df_raw.columns)
        if missing_required:
            metadata["errors"].append(
                f"Missing required columns: {', '.join(missing_required)}"
            )
            return df_raw, metadata

        # --- 3️⃣ Convert dates safely ---
        df_raw["date"] = pd.to_datetime(df_raw["date"], errors="coerce")
        if df_raw["date"].isna().all():
            metadata["errors"].append("All 'date' values could not be parsed.")
            return df_raw, metadata

        # --- 4️⃣ Filter invalid MAILITM_FID entries ---
        valid_mask = df_raw["MAILITM_FID"].astype(str).str[-2:].str.isalpha()
        rows_removed_invalid = int((~valid_mask).sum())
        if rows_removed_invalid > 0:
            metadata["warnings"].append(
                f"Removed {rows_removed_invalid} rows with invalid MAILITM_FID"
            )
        df = df_raw[valid_mask].copy()

        # --- 5️⃣ Derive and clean ---
        df["country"] = df["MAILITM_FID"].astype(str).str[-2:]
        if "RECPTCL_FID" in df.columns:
            df = df.drop(columns=["RECPTCL_FID"])

        df = df.sort_values(["MAILITM_FID", "date"])

        # --- 6️⃣ Duration calculations ---
        df["duration_to_next_step"] = (
            df.groupby("MAILITM_FID")["date"].shift(-1) - df["date"]
        )
        first_date = df.groupby("MAILITM_FID")["date"].transform("first")
        last_date = df.groupby("MAILITM_FID")["date"].transform("last")
        df["total_duration"] = last_date - first_date

        # --- 7️⃣ Guarantee columns ---
        for col in [
            "EVENT_TYPE_CD",
            "établissement_postal",
            "next_établissement_postal",
        ]:
            if col not in df.columns:
                df[col] = None
                metadata["warnings"].append(f"Added missing column '{col}'")
            else:
                df[col] = df[col].astype(str).str.strip().replace("nan", None)

        df["MAILITM_FID"] = df["MAILITM_FID"].astype(str).str.strip()
        df["EVENT_TYPE_CD"] = df["EVENT_TYPE_CD"].astype(str).str.strip()

        # --- 8️⃣ Deduplication ---
        before_dedup = len(df)
        df = df.drop_duplicates(
            subset=["MAILITM_FID", "date", "EVENT_TYPE_CD", "établissement_postal"],
            keep="first",
        )
        rows_removed_duplicates = int(before_dedup - len(df))
        if rows_removed_duplicates > 0:
            metadata["warnings"].append(
                f"Removed {rows_removed_duplicates} duplicate rows"
            )

        # --- 9️⃣ Compute statistics ---
        avg_step_duration = df["duration_to_next_step"].mean()
        avg_total_duration = df["total_duration"].mean()

        earliest_date = df["date"].min()
        latest_date = df["date"].max()
        time_range_days = (
            (latest_date - earliest_date).days
            if pd.notna(earliest_date) and pd.notna(latest_date)
            else None
        )

        missing_values_count = int(df.isna().sum().sum())
        missing_values_by_column = df.isna().sum().to_dict()

        columns = list(df.columns)
        n_rows = len(df)
        n_columns = len(columns)

        unique_packages_count = int(df["MAILITM_FID"].nunique())
        unique_event_types = int(df["EVENT_TYPE_CD"].nunique())
        top_event_types = df["EVENT_TYPE_CD"].value_counts().head(10).to_dict()

        cleaning_time_seconds = round(time.time() - start_time, 3)

        # --- 🔟 Populate summary ---
        metadata.update(
            {
                "n_rows": n_rows,
                "n_columns": n_columns,
                "columns": columns,
                "missing_values_count": missing_values_count,
                "missing_values_by_column": missing_values_by_column,
                "unique_packages_count": unique_packages_count,
                "unique_event_types": unique_event_types,
                "top_event_types": top_event_types,
                "earliest_date": earliest_date,
                "latest_date": latest_date,
                "time_range_days": time_range_days,
                "cleaning_time_seconds": cleaning_time_seconds,
            }
        )

        metadata.update(
            {
                "rows_removed_due_to_invalid_id": rows_removed_invalid,
                "rows_removed_due_to_duplicates": rows_removed_duplicates,
                "avg_total_duration_seconds": (
                    avg_total_duration.total_seconds()
                    if pd.notna(avg_total_duration)
                    else None
                ),
                "avg_step_duration_seconds": (
                    avg_step_duration.total_seconds()
                    if pd.notna(avg_step_duration)
                    else None
                ),
            }
        )

    except Exception as e:
        metadata["errors"].append(f"Unexpected error: {str(e)}")
        metadata["traceback"] = traceback.format_exc()

    return df if "df" in locals() else pd.DataFrame(), metadata


def save_upload_metadata(uploaded_file, metadata, extra_stats=None):
    """
    Creates and saves an UploadMetaData entry from the given file and metadata.
    Automatically fills all fields that exist in the model and gracefully skips missing ones.
    """
    data = {}

    # --- File info ---
    data["filename"] = getattr(uploaded_file, "name", "unknown.csv")
    data["file_size_bytes"] = getattr(uploaded_file, "size", 0)
    data["file_type"] = os.path.splitext(data["filename"])[-1].replace(".", "") or "csv"
    data["upload_timestamp"] = timezone.now()

    # --- Metadata mapping (auto-skip missing keys) ---
    direct_fields = [
        "n_rows",
        "n_columns",
        "columns",
        "missing_values_count",
        "missing_values_by_column",
        "unique_packages_count",
        "unique_event_types",
        "top_event_types",
        "earliest_date",
        "latest_date",
        "time_range_days",
        "cleaning_time_seconds",
        "avg_step_duration_seconds",
        "avg_total_duration_seconds",
    ]
    for key in direct_fields:
        if key in metadata:
            data[key] = metadata[key]

    # --- Field name mapping for your model ---
    data["rows_removed_duplicates"] = metadata.get("rows_removed_due_to_duplicates")
    data["rows_removed_invalid"] = metadata.get("rows_removed_due_to_invalid_id")

    # --- Merge any processing stats ---
    if extra_stats:
        valid_fields = {f.name for f in UploadMetaData._meta.fields}
        for k, v in extra_stats.items():
            if k in valid_fields:
                data[k] = v

    # --- Ensure numeric defaults ---
    defaults = {
        "events_inserted": 0,
        "packages_created": 0,
        "packages_updated": 0,
        "alerts_created": 0,
    }
    for k, v in defaults.items():
        data.setdefault(k, v)

    # --- Save ---
    record = UploadMetaData.objects.create(**data)
    return record
