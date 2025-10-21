import React, { useState } from "react";
import type { Dashboard } from "../../types";

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
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 📊 StatCards — Grid of all Dashboard KPIs
// ─────────────────────────────────────────────
interface StatCardsProps {
  stats?: Dashboard;
  onCardClick?: (kpiKey: keyof Dashboard | null, index: number | null) => void;
  lineChart?: any;
}

const StatCards: React.FC<StatCardsProps> = ({ stats, onCardClick }) => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const handleCardClick = (key: keyof Dashboard, index: number) => {
    const newSelected = selectedCard === index ? null : index;
    setSelectedCard(newSelected);
    if (onCardClick) {
      onCardClick(newSelected !== null ? key : null, newSelected);
    }
  };

  // ─────────────────────────────
  // 🗺️ KPI Keys → French Labels
  // ─────────────────────────────
  const KPI_TO_TITLE_AND_COLOR: Record<
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
        {!!stats ? (
          Object.entries(stats).map(([key, value], index) => {
            const k = key as keyof Dashboard;
            const config = KPI_TO_TITLE_AND_COLOR[k];
            if (!config) return null;

            return (
              <StatCard
                key={key}
                title={config.title}
                value={value}
                color={config.color}
                onClick={() => handleCardClick(k, index)}
                isSelected={selectedCard === index}
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
