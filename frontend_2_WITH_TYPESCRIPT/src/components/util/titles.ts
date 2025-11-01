import type { AirportStats, CPXStats, CTNIStats, Dashboard } from "../../types";

export function kpiNameToTitle(
  kpi: keyof Dashboard | keyof CTNIStats | keyof CPXStats | keyof AirportStats,
): string {
  switch (kpi) {
    // --- Metadata ---
    case "timestamp":
      return "Dernière mise à jour";

    // --- Volumes ---
    case "incoming_bags_count":
      return "Sacs entrants";
    case "outgoing_bags_count":
      return "Sacs sortants";
    case "delayed_arrivals_count":
      return "Arrivées retardées";
    case "unprocessed_items_count":
      return "Éléments non traités";

    // --- Efficiency / Throughput ---
    case "avg_sorting_time":
      return "Temps moyen de tri";
    case "max_sorting_time":
      return "Temps maximum de tri";
    case "throughput_rate":
      return "Taux de traitement";
    case "avg_items_per_bag":
      return "Éléments moyens par sac";

    // --- Exceptions / Traceability ---
    case "unscanned_items_count":
    case "unscanned_items":
      return "Éléments non scannés";
    case "misrouted_items_count":
      return "Éléments mal dirigés";
    case "damaged_items_count":
      return "Éléments endommagés";
    case "alerts_triggered_count":
      return "Alertes déclenchées";
    case "seized_items_count":
      return "Éléments saisis";

    // --- Transit / Timing ---
    case "avg_holding_time":
      return "Temps moyen de rétention";
    case "median_holding_time":
      return "Temps médian de rétention";
    case "items_exceeding_holding_time":
      return "Éléments dépassant le temps de rétention";

    // --- Dashboard-specific KPIs ---
    case "pre_arrived_dispatches_count":
      return "Expéditions pré-arrivées";
    case "items_delivered":
      return "Éléments livrés";
    case "items_delivered_after_one_fail":
      return "Livrés après un échec";
    case "undelivered_items":
      return "Éléments non livrés";
    case "delivery_rate":
      return "Taux de livraison";
    case "on_time_delivery_rate":
      return "Livraison à temps (%)";
    case "items_blocked_in_customs":
      return "Bloqués en douane";
    case "returned_items":
      return "Éléments retournés";
    case "consolidation_time":
    case "airport_consolidation_time":
    case "shipment_consolidation_time":
      return "Temps de consolidation";
    case "end_to_end_transit_time_average":
      return "Temps moyen de transit complet";

    default:
      return "N/A";
  }
}
