export interface Dashboard {
  timestamp: string; // ISO string
  pre_arrived_dispatches_count: number;
  items_delivered: number;
  items_delivered_after_one_fail: number;
  undelivered_items: number;
  delivery_rate: number;
  on_time_delivery_rate: number;
  items_exceeding_holding_time: number;
  items_blocked_in_customs: number;
  returned_items: number;
  consolidation_time: string;
  end_to_end_transit_time_average: string;
  shipment_consolidation_time: string;
  unscanned_items: number;
}

export interface KPIHistory {
  kpi_name: string;
  timestamp: string; // ISO string
  value: number;
  name: string;
}

export interface DashboardGetResponse {
  success: boolean;
  data?: Dashboard;
  message?: string;
}
export interface DashboardPostRequest {
  kpi_field_name: string;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
}
export interface DashboardPostResponse {
  success: boolean;
  kpi?: string;
  start_date?: string;
  end_date?: string;
  data?: KPIHistory[];
  message?: string;
}
