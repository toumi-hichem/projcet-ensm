import type { Dashboard } from "../../types";

export const KPI_TO_TITLE_AND_COLOR: Record<
  keyof Dashboard,
  { title: string; color: string }
> = {
  timestamp: { title: "Horodatage", color: "#6366f1" },
  pre_arrived_dispatches_count: {
    title: "Envois pré-arrivés",
    color: "#3b82f6",
  },
  items_delivered: { title: "Articles livrés", color: "#22c55e" },
  items_delivered_after_one_fail: {
    title: "Livrés après un échec",
    color: "#14b8a6",
  },
  undelivered_items: { title: "Articles non livrés", color: "#ef4444" },
  delivery_rate: { title: "Taux de livraison", color: "#f59e0b" },
  on_time_delivery_rate: {
    title: "Livraison à temps",
    color: "#10b981",
  },
  items_exceeding_holding_time: {
    title: "Temps de garde dépassé",
    color: "#f97316",
  },
  items_blocked_in_customs: {
    title: "Bloqués en douane",
    color: "#a855f7",
  },
  returned_items: { title: "Articles retournés", color: "#dc2626" },
  consolidation_time: { title: "Temps de consolidation", color: "#0ea5e9" },
  end_to_end_transit_time_average: {
    title: "Temps moyen E2E",
    color: "#8b5cf6",
  },
  shipment_consolidation_time: {
    title: "Consolidation des expéditions",
    color: "#3b82f6",
  },
  unscanned_items: { title: "Articles non scannés", color: "#f87171" },
};
