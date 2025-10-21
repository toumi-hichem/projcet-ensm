import pandas as pd
import numpy as np
from core.models import Package, PackageTransition

# ---------------------------

df_etab = pd.read_csv("core/data/code_etablissement.csv")
# Load duration matrix (SLA baselines)
# ---------------------------
def load_duration_matrix(path="core/data/wilayas_cleaned.csv"):
    duration_matrix = pd.read_csv(path, index_col=0)

    # Convert all values into Timedelta safely
    def to_timedelta_or_nat(x):
        if pd.isna(x):
            return pd.NaT
        if isinstance(x, pd.Timedelta):
            return x
        if isinstance(x, (int, float, np.integer, np.floating)):
            return pd.to_timedelta(float(x), unit="D")
        try:
            return pd.to_timedelta(str(x))
        except Exception:
            return pd.NaT

    duration_matrix = duration_matrix.applymap(to_timedelta_or_nat)

    # Harmonize indices/columns → int
    duration_matrix.index = pd.to_numeric(duration_matrix.index, errors="coerce")
    duration_matrix.columns = pd.to_numeric(duration_matrix.columns, errors="coerce")
    duration_matrix = duration_matrix.dropna(axis=0, how="all").dropna(axis=1, how="all")
    duration_matrix.index = duration_matrix.index.astype(int)
    duration_matrix.columns = duration_matrix.columns.astype(int)

    return duration_matrix


# ---------------------------
# New → Old wilaya mapping
# ---------------------------
new_to_old = {
    49: 1, 50: 1,
    51: 7, 52: 8,
    53: 11, 54: 11,
    55: 30, 56: 33,
    57: 39, 58: 47,
}

def canonical_old_wilaya(code_upw):
    """Return canonical old wilaya int (1..48) or None if not mappable"""
    if pd.isna(code_upw):
        return None
    try:
        n = int(float(code_upw))
    except Exception:
        return None
    return new_to_old.get(n, n)


# ---------------------------
# Build transitions
# ---------------------------
def build_transitions(df_clean, df_etab, duration_matrix=None):
    """
    Build PackageTransition rows based on block-to-block transitions.
    df_clean : cleaned package events (DataFrame)
    df_etab  : postal office lookup (DataFrame with bp_nm → code_upw)
    duration_matrix : SLA baseline matrix (DataFrame)
    """

    if duration_matrix is None:
        duration_matrix = load_duration_matrix()

    print(">>> build_transitions CALLED with", len(df_clean), "rows")

    transitions_to_create = []

    # Merge postal office → UPW
    df_clean = df_clean.merge(
        df_etab[["bp_nm", "code_upw"]],
        left_on="établissement_postal",
        right_on="bp_nm",
        how="left"
    )

    # Preload Package.id lookup
    unique_ids = df_clean["MAILITM_FID"].unique()
    package_map = dict(
        Package.objects.filter(mailitm_fid__in=unique_ids)
        .values_list("mailitm_fid", "id")
    )

    for pkg_id, df_pkg in df_clean.groupby("MAILITM_FID"):
        package_id = package_map.get(pkg_id)
        if not package_id:
            continue

        # ensure datetime
        df_pkg["date"] = pd.to_datetime(df_pkg["date"])

        # ---------------------------
        # Build "blocks" per UPW (first & last timestamps)
        # ---------------------------
        blocks = []
        for code_upw, group in df_pkg.groupby("code_upw", sort=False):
            times = group["date"].sort_values()
            blocks.append({
                "code_upw": code_upw,
                "first_time": times.iloc[0],
                "last_time": times.iloc[-1],
            })

        # ---------------------------
        # Evaluate transitions block → block
        # ---------------------------
        for i in range(len(blocks) - 1):
            prev, nxt = blocks[i], blocks[i + 1]
            o_raw, d_raw = prev["code_upw"], nxt["code_upw"]
            o_can, d_can = canonical_old_wilaya(o_raw), canonical_old_wilaya(d_raw)
            actual = nxt["first_time"] - prev["last_time"]

            allowed, late = None, None

            if o_can is not None and d_can is not None:
                if (o_can in duration_matrix.index) and (d_can in duration_matrix.columns):
                    allowed_val = duration_matrix.loc[o_can, d_can]
                    if pd.notna(allowed_val):
                        allowed = allowed_val
                        late = actual > allowed

            transitions_to_create.append(
                PackageTransition(
                    package_id=package_id,
                    origin_upw=o_can,
                    dest_upw=d_can,
                    actual_duration=actual,
                    allowed_duration=allowed,
                    late=bool(late) if late is not None else False,
                )
            )

    # ---------------------------
    # Bulk insert
    # ---------------------------
    if transitions_to_create:
        PackageTransition.objects.bulk_create(transitions_to_create, batch_size=1000)
        print(f">>> {len(transitions_to_create)} transitions created")
    else:
        print(">>> No transitions created")
