import pandas as pd
import io

def clean_package_data(raw_csv_file):
    import pandas as pd
    import io
    text_stream = io.TextIOWrapper(raw_csv_file, encoding="utf-8")
    df = pd.read_csv(text_stream, sep=",", dtype=str)
    df["date"] = pd.to_datetime(df["date"])
    df = df[df["MAILITM_FID"].str[-2:].str.isalpha()]
    df["country"] = df["MAILITM_FID"].str[-2:]
    df = df.sort_values(["MAILITM_FID", "date"])
    df = df.drop(columns=["RECPTCL_FID"])
    df["duration_to_next_step"] = df.groupby("MAILITM_FID")["date"].shift(-1) - df["date"]
    first_date = df.groupby("MAILITM_FID")["date"].transform("first")
    last_date = df.groupby("MAILITM_FID")["date"].transform("last")
    df["total_duration"] = last_date - first_date

    # Guarantee needed columns and sanitize
    for col in ["EVENT_TYPE_CD", "établissement_postal", "next_établissement_postal"]:
        if col not in df.columns:
            df[col] = None
        else:
            df[col] = df[col].astype(str).str.strip().replace('nan', None)
    df["MAILITM_FID"] = df["MAILITM_FID"].astype(str).str.strip()
    df["EVENT_TYPE_CD"] = df["EVENT_TYPE_CD"].astype(str).str.strip()
    df["date"] = pd.to_datetime(df["date"])

    # --- Final deduplication ---
    df = df.drop_duplicates(subset=["MAILITM_FID", "date", "EVENT_TYPE_CD", "établissement_postal"], keep="first")

    return df

def sanitize_for_json(df):
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]) or pd.api.types.is_timedelta64_dtype(df[col]):
            df[col] = df[col].astype(str).replace('NaT', None)
    df = df.where(pd.notnull(df), None)
    return df
