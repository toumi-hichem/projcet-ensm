import React, { useState } from "react";
import type {
  AirportStats,
  CPXStats,
  CTNIStats,
  Dashboard,
  SelectedCardType,
} from "../../types";
import { KPI_TO_TITLE_AND_COLOR } from "../constants/kpi_titles";

function formatValue(value: number | string): string {
  if (typeof value === "number") {
    // Percentage case (0–1 float)
    if (value >= 0 && value <= 1) {
      return `${(value * 100).toFixed(1)}%`;
    }
    // Normal number
    return value.toLocaleString();
  }

  if (typeof value === "string") {
    // Try to detect ISO timedelta or human-like timedelta
    const isoMatch = value.match(
      /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
    );
    if (isoMatch) {
      const [, days, hours, minutes, seconds] = isoMatch;
      const parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes) parts.push(`${minutes}m`);
      if (seconds) parts.push(`${Math.floor(Number(seconds))}s`);
      return parts.join(" ");
    }

    // Case like "1 day, 2:30:00"
    const humanTimeMatch = value.match(/(\d+)\s*day[s]?,?\s*(\d+):(\d+):(\d+)/);
    if (humanTimeMatch) {
      const [, days, hours, minutes] = humanTimeMatch;
      const parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes) parts.push(`${minutes}m`);
      return parts.join(" ");
    }

    // Fallback: return as-is
    return value;
  }

  return String(value);
}

// ─────────────────────────────────────────────
// 🎨 StatCard — Single Card Component
// ─────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  color?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  color = "#1e40af",
  onClick,
  isSelected = false,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "8px",
        padding: "0",
        minWidth: "80px",
        maxWidth: "150px",
        height: "95px",
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "white",
        boxShadow: isSelected
          ? "0 4px 12px rgba(0, 0, 0, 0.2)"
          : "0 2px 4px rgba(0, 0, 0, 0.1)",
        position: "relative",
        overflow: "hidden",
        marginTop: "5px",
        marginBottom: "20px",
        background: color,
        cursor: "pointer",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        transition: "all 0.2s ease",
        border: isSelected ? "2px solid #60a5fa" : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "scale(1.11)";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        }
      }}
    >
      {/* Title */}
      <div
        style={{
          height: "60px",
          padding: "10px 6px 0 6px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          textAlign: "center",
          lineHeight: "1.2",
        }}
      >
        <span
          style={{
            fontSize: "clamp(12px, 1.2vw, 11px)",
            fontWeight: "600",
            wordWrap: "break-word",
            hyphens: "auto",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </span>
      </div>

      {/* Value */}
      <div
        style={{
          height: "35px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "clamp(22px, 2vw, 20px)",
            fontWeight: "bold",
            lineHeight: "1",
          }}
        >
          {formatValue(value)}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 📊 StatCards — Grid of all Dashboard KPIs
// ─────────────────────────────────────────────
interface StatCardsProps {
  stats?: Dashboard | CTNIStats | CPXStats | AirportStats;
  onCardClick?: (kpiKey: keyof Dashboard | null, index: number | null) => void;
  lineChart?: any;
  selectedCard: SelectedCardType;
}

const StatCards: React.FC<StatCardsProps> = ({
  stats,
  onCardClick,
  selectedCard,
}) => {
  const color = "#2e75e7ff";
  console.log("Showing these stats: ", stats);
  const handleCardClick = (key: keyof Dashboard, index: number) => {
    const newSelected =
      selectedCard?.index === index
        ? { key: null, index: null }
        : { key, index };
    if (onCardClick) {
      onCardClick(newSelected.key, newSelected.index);
    }
  };

  // ─────────────────────────────
  // 🗺️ KPI Keys → French Labels
  // ─────────────────────────────

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          width: "100%",
          alignItems: "stretch",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          minHeight: "95px",
          marginBottom: "0",
        }}
      >
        {stats ? (
          Object.entries(stats).map(([key, value], index) => {
            const k = key as keyof Dashboard;
            const config = KPI_TO_TITLE_AND_COLOR[k];
            if (!config) return null;

            return (
              <StatCard
                key={key}
                title={config.title}
                value={value}
                color={color}
                onClick={() => handleCardClick(k, index)}
                isSelected={selectedCard?.index === index}
              />
            );
          })
        ) : (
          <div>loading</div>
        )}
      </div>
    </div>
  );
};

export { StatCard, StatCards };
export default StatCards;
