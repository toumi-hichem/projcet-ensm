// types/majorCenters.ts

export interface CTNIStats {
  timestamp: string;

  // Counts (Operational Volumes)
  ctni_pre_arrived_dispatches_count: number;
  ctni_items_delivered: number;
  ctni_items_delivered_after_one_fail: number;
  ctni_undelivered_items: number;

  // KPI Rates (Performance)
  ctni_delivery_rate: number;
  ctni_on_time_delivery_rate: number;

  // Delays and Exceptions
  ctni_items_exceeding_holding_time: number;
  ctni_items_blocked_in_customs: number;
  ctni_returned_items: number;

  // Transit Time KPIs (Delays)
  ctni_consolidation_time: string;
  ctni_end_to_end_transit_time_average: string;
  ctni_shipment_consolidation_time: string;

  // Exceptions / Traceability
  ctni_unscanned_items: number;
}

export interface CPXStats {
  timestamp: string;
  cpx_pre_arrived_dispatches_count: number;
  cpx_items_delivered: number;
  cpx_items_delivered_after_one_fail: number;
  cpx_undelivered_items: number;
  cpx_delivery_rate: number;
  cpx_on_time_delivery_rate: number;
  cpx_items_exceeding_holding_time: number;
  cpx_items_blocked_in_customs: number;
  cpx_returned_items: number;
  cpx_consolidation_time: string;
  cpx_end_to_end_transit_time_average: string;
  cpx_shipment_consolidation_time: string;
  cpx_unscanned_items: number;
}

export interface AirportStats {
  timestamp: string;
  airport_pre_arrived_dispatches_count: number;
  airport_items_delivered: number;
  airport_items_delivered_after_one_fail: number;
  airport_undelivered_items: number;
  airport_delivery_rate: number;
  airport_on_time_delivery_rate: number;
  airport_items_exceeding_holding_time: number;
  airport_items_blocked_in_customs: number;
  airport_returned_items: number;
  airport_consolidation_time: string;
  airport_end_to_end_transit_time_average: string;
  airport_shipment_consolidation_time: string;
  airport_unscanned_items: number;
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
