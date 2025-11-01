import React, { useState } from "react";
import type { Alert, StateStats, OfficeStats } from "../../types";
import { KpiCard } from "../ui/kpi-card";
import { AlertCard } from "../ui/alert-card";

interface Props {
  title: string;
  stats: StateStats | OfficeStats;
  alerts: Alert[];
  setAlerts: (updater: (prev: Alert[]) => Alert[]) => void;
}

export const DataPanel: React.FC<Props> = ({
  title,
  stats,
  alerts,
  setAlerts,
}) => {
  const [view, setView] = useState<"alerts" | "kpis">("alerts");

  const handleAcknowledge = (id: number) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        color: "black",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {title}
        </h3>

        {/* Toggle Buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            background: "#f3f4f6",
            borderRadius: 8,
            padding: 4,
          }}
        >
          <button
            onClick={() => setView("alerts")}
            style={{
              background: view === "alerts" ? "#111827" : "transparent",
              color: view === "alerts" ? "white" : "#111827",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Alertes
          </button>
          <button
            onClick={() => setView("kpis")}
            style={{
              background: view === "kpis" ? "#111827" : "transparent",
              color: view === "kpis" ? "white" : "#111827",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            KPIs
          </button>
        </div>
      </div>

      {/* Conditional Content */}
      {view === "alerts" ? (
        <div
          style={{
            maxHeight: "50vh",
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          <AlertCard alerts={alerts} onAcknowledge={handleAcknowledge} />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {Object.entries(stats)
            .filter(([key, value]) =>
              ["id", "timestamp"].includes(key)
                ? false
                : typeof value === "number" || typeof value === "string",
            )
            .map(([key, value]) => (
              <KpiCard key={key} title={key} value={value} />
            ))}
        </div>
      )}
    </div>
  );
};
