import React from "react";
import { formatValue } from "../util/format-kpi";
import type { AirportStats, CPXStats, CTNIStats, KPIRep } from "../../types";

interface KpiCardProps {
  title: string;
  value: number | string;
  onCardClick?: (kpi: KPIRep) => void;
  index?: number;
  kpiKey?: keyof CPXStats | keyof CTNIStats | keyof AirportStats;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  onCardClick,
  index,
  kpiKey,
}) => {
  const handleCardClick = () => {
    if (onCardClick) onCardClick({ key: kpiKey, index });
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
        color: "white",
        borderRadius: "10px",
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textAlign: "center",
        minHeight: "75px",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 3px 8px rgba(37,99,235,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "capitalize",
          marginBottom: 4,
          opacity: 0.9,
        }}
      >
        {title.replaceAll("_", " ")}
      </div>
      <div
        style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {formatValue(value)}
      </div>
    </div>
  );
};
