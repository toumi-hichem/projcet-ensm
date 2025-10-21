export const mapping = {
  // 📦 Counts (Operational Volumes)
  "Nombre de dépêches pré-arrivées": "pre_arrived_dispatches_count",
  "Nombre d'envois livrés": "items_delivered",
  "Nombre d'envois livrés dès la première tentative (1 échec)":
    "items_delivered_after_one_fail",
  "Nombre d'envois non livrés": "undelivered_items",

  // 📈 KPI Rates (Performance)
  "Taux de livraison": "delivery_rate",
  "Taux de livraison dans les délais": "on_time_delivery_rate",

  // ⏱️ Delays and Exceptions
  "Nombre d'envois en dépassement du délai de garde":
    "items_exceeding_holding_time",
  "Nombre d'envois bloqués en douane": "items_blocked_in_customs",
  "Nombre d'envois retournés": "returned_items",

  // 🚚 Transit Time KPIs (Delays)
  "Délai de concentration": "consolidation_time",
  "Délai d'acheminement des envois de bout en bout":
    "end_to_end_transit_time_average",
  "Délai de concentration des envois": "shipment_consolidation_time",

  // ⚠️ Exceptions / Traceability
  "Nombre d'envois non scannés": "unscanned_items",
};

export function getModelField(
  center: "ctni" | "cpx" | "airport",
  label: string,
): string | undefined {
  const base = mapping[label];
  return base ? `${center}_${base}` : undefined;
}
