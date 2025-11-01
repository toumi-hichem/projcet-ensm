import type { AirportStats, CPXStats, CTNIStats, Dashboard } from "../../types";

export function kpiNameToDescription(
  kpi: keyof Dashboard | keyof CTNIStats | keyof CPXStats | keyof AirportStats,
): string {}
