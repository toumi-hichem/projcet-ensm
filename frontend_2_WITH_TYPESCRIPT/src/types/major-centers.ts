// types/majorCenters.ts

export interface CTNIStats {
  id: number;
  timestamp: string;

  // Volumes
  incoming_bags_count: number;
  outgoing_bags_count: number;
  delayed_arrivals_count: number;
  unprocessed_items_count: number;

  // Efficiency / Throughput
  avg_sorting_time: string | null;
  max_sorting_time: string | null;
  throughput_rate: number;
  avg_items_per_bag: number;

  // Exceptions / Traceability
  unscanned_items_count: number;
  misrouted_items_count: number;
  damaged_items_count: number;
  alerts_triggered_count: number;
  seized_items_count: number;

  // Transit / Timing
  avg_holding_time: string | null;
  median_holding_time: string | null;
  items_exceeding_holding_time: number;
}

export interface CPXStats {
  id: number;
  timestamp: string;

  // Volumes
  incoming_bags_count: number;
  outgoing_bags_count: number;
  delayed_arrivals_count: number;
  unprocessed_items_count: number;

  // Efficiency / Throughput
  avg_sorting_time: string | null;
  max_sorting_time: string | null;
  throughput_rate: number;
  avg_items_per_bag: number;

  // Exceptions / Traceability
  unscanned_items_count: number;
  misrouted_items_count: number;
  damaged_items_count: number;
  alerts_triggered_count: number;
  seized_items_count: number;

  // Transit / Timing
  avg_holding_time: string | null;
  median_holding_time: string | null;
  items_exceeding_holding_time: number;
}

export interface AirportStats {
  id: number;
  timestamp: string; // ISO datetime string

  // 📦 Lifecycle & Volume
  bags_created_count: number;
  bags_closed_count: number;
  bags_reopened_count: number;
  bags_deleted_count: number;
  bags_modified_count: number;

  // 🌍 Domestic / International Flow
  domestic_bags_sent_count: number;
  domestic_bags_received_count: number;
  international_bags_sent_count: number;
  international_bags_received_count: number;
  international_vs_domestic_ratio: number;

  // 🕓 Timing & Performance
  avg_bag_lifecycle_time: string | null; // ISO 8601 duration or null
  avg_duration_to_export: string | null;
  avg_duration_to_delivery: string | null;
  avg_transit_duration_domestic: string | null;
  avg_transit_duration_international: string | null;
  max_transit_duration: string | null;
  avg_handling_duration: string | null;

  // ⚠️ Quality & Exceptions
  bags_sampled_count: number;
  bags_with_carrier_count: number;
  bags_with_missing_next_office: number;
  bags_with_missing_country: number;
  bags_in_customs_count: number;
}

export type MajorCenterID = "ctni" | "cpx" | "airport" | "all";

export interface MajorCenterResponseBase {
  success: boolean;
  message?: string;
}

export interface MajorCenterSingleResponse extends MajorCenterResponseBase {
  data?: {
    ctni?: CTNIStats;
    cpx?: CPXStats;
    airport?: AirportStats;
  };
}

export interface MajorCenterAllResponse extends MajorCenterResponseBase {
  data?: {
    ctni: CTNIStats;
    cpx: CPXStats;
    airport: AirportStats;
  };
}

export type MajorCenterResponse =
  | MajorCenterSingleResponse
  | MajorCenterAllResponse;

export type KPIStat = {
  key: keyof CPXStats | keyof CTNIStats | keyof AirportStats;
  index?: number;
  title: string;
  value: number | string | null;
  color: string;
  chartData: any[]; // shape depends on LineChart; keep flexible
};
export type KPIRep = {
  key: keyof CPXStats | keyof CTNIStats | keyof AirportStats;
  index?: number;
};
export type Office = {
  id: MajorCenterID;
  name: string;
  location: string;
  stats: KPIStat[];
};
