// ─────────────────────────────────────────────
// ⚙️ Alert Type
// ─────────────────────────────────────────────
export interface Alert {
  id: number;
  timestamp: string; // ISO date string
  alarm_code: string;
  title: string;
  trigger_condition: string;
  severity: string;
  action_required: string;
  acknowledged: boolean;
}

// ─────────────────────────────────────────────
// 📊 StateStats (from Django serializer)
// ─────────────────────────────────────────────
export interface StateStats {
  id: number;
  state_id: string | number;
  name: string;
  pre_arrived_dispatches_count: number;
  items_delivered: number;
  undelivered_items: number;
  // ... add all serialized fields from your StateStatsSerializer
}

// ─────────────────────────────────────────────
// 🏢 OfficeStats (from Django serializer)
// ─────────────────────────────────────────────
export interface OfficeStats {
  id: number;
  office_id: string | number;
  name: string;
  pre_arrived_dispatches_count: number;
  items_delivered: number;
  undelivered_items: number;
  // ... add all serialized fields from your OfficeStatsSerializer
}

// ─────────────────────────────────────────────
// 🌍 API Response Types
// ─────────────────────────────────────────────
export interface OneStateResponse {
  state: StateStats;
  alerts: Alert[];
  success: boolean;
  message?: string;
}

export interface OneOfficeResponse {
  office: OfficeStats;
  alerts: Alert[];
  success: boolean;
  message?: string;
}
