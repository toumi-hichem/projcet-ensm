export interface UploadMetaData {
  id: number;
  filename: string;
  file_size_bytes: number;
  file_type: string;
  upload_timestamp: string; // ISO date string

  // DataFrame stats
  n_rows: number;
  n_columns: number;
  columns: string[]; // since JSONField from pandas columns → list of strings
  missing_values_count: number;
  missing_values_by_column?: Record<string, number> | null;
  unique_packages_count: number;
  unique_event_types: number;
  top_event_types?: Record<string, number> | null;

  // Date range
  earliest_date?: string | null;
  latest_date?: string | null;
  time_range_days?: number | null;

  // Processing
  events_inserted: number;
  packages_created: number;
  packages_updated: number;
  alerts_created: number;

  // Cleaning summary
  cleaning_time_seconds?: number | null;
  avg_step_duration_seconds?: number | null;
  avg_total_duration_seconds?: number | null;
  rows_removed_duplicates?: number | null;
  rows_removed_invalid?: number | null;

  // Optional remarks
  notes?: string | null;
}

export interface BagUploadMetaData {
  id?: number; // optional, if you include DB IDs
  filename: string;
  file_size_bytes: number;
  file_type: string;
  upload_timestamp: string; // ISO date string (from Django)
  processing_duration_seconds?: number | null;

  // DataFrame stats
  n_rows: number;
  n_columns: number;
  columns: Record<string, any>; // JSONField
  missing_values_count: number;
  missing_values_by_column?: Record<string, number> | null;
  unique_bags_count: number;
  unique_event_types: number;
  top_event_types?: Record<string, number> | null;

  // Date range
  earliest_date?: string | null;
  latest_date?: string | null;
  time_range_days?: number | null;

  // Processing
  events_inserted: number;
  bags_created: number;
  bags_updated: number;

  // Cleaning summary
  cleaning_time_seconds?: number | null;
  avg_step_duration_seconds?: number | null;
  avg_total_duration_seconds?: number | null;
  rows_removed_duplicates?: number | null;

  // Optional remarks
  notes?: string | null;
}

export interface UploadListResponse {
  success: boolean;
  count: number;
  packages: UploadMetaData[];
  bags: BagUploadMetaData[];
}
