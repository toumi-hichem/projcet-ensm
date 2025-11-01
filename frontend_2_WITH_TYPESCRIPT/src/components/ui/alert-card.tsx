import React, { useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { Alert } from "../../types";

interface AlertCardProps {
  alerts: Alert[];
  onAcknowledge: (alertId: number) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alerts = [],
  onAcknowledge,
}) => {
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const handleAcknowledge = async (alertId: number) => {
    setLoadingIds((prev) => [...prev, alertId]);

    try {
      // ✅ Fixed endpoint (removed /api prefix)
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/alerts/${alertId}/acknowledge/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          `Failed to acknowledge alert ${alertId}:`,
          errorData.message || response.statusText,
        );
        return;
      }

      // ✅ Call callback only on success
      const data = await response.json();
      onAcknowledge(alertId);
      console.log(`Alert ${alertId} acknowledged successfully`, data);
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== alertId));
    }
  };

  if (alerts.length === 0) return null;

  const filteredAlerts = showOnlyActive
    ? alerts.filter((a) => !a.acknowledged)
    : alerts;

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div
      style={{
        background: "#fff",
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: activeCount > 0 ? "#b91c1c" : "#166534",
            fontWeight: 700,
          }}
        >
          <AlertTriangle size={20} />
          {activeCount > 0
            ? `${activeCount} Alarme${activeCount > 1 ? "s" : ""} active${
                activeCount > 1 ? "s" : ""
              }`
            : "Aucune alarme active"}
        </div>

        {/* Toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
            cursor: "pointer",
            color: "#111827",
          }}
        >
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
          />
          Afficher uniquement les non-acquittées
        </label>
      </div>

      {/* Alerts List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredAlerts.map((a) => {
          const isAck = a.acknowledged;
          return (
            <div
              key={a.id}
              style={{
                background: isAck ? "#f0fdf4" : "#fff",
                border: isAck ? "1px solid #86efac" : "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: isAck ? "#166534" : "#991b1b",
                      marginBottom: 2,
                    }}
                  >
                    {a.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: isAck ? "#15803d" : "#7f1d1d",
                      marginBottom: 6,
                    }}
                  >
                    <strong>Gravité :</strong>{" "}
                    <span style={{ textTransform: "capitalize" }}>
                      {a.severity}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: isAck ? "#15803d" : "#7f1d1d",
                    }}
                  >
                    <strong>Condition :</strong> {a.trigger_condition}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: isAck ? "#15803d" : "#7f1d1d",
                    }}
                  >
                    <strong>Action :</strong> {a.action_required}
                  </div>
                </div>

                {/* Acknowledge Button */}
                {!isAck && (
                  <button
                    onClick={() => handleAcknowledge(a.id)}
                    disabled={loadingIds.includes(a.id)}
                    style={{
                      background: loadingIds.includes(a.id)
                        ? "#fca5a5"
                        : "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: "0.8rem",
                      cursor: loadingIds.includes(a.id)
                        ? "not-allowed"
                        : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "background 0.2s",
                    }}
                  >
                    {loadingIds.includes(a.id) ? (
                      "..."
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Acquitter
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* ✅ Acknowledged marker */}
              {isAck && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "#16a34a",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  <CheckCircle size={14} />
                  Acquittée
                </div>
              )}
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.9rem",
              padding: "8px 0",
            }}
          >
            Aucune alarme à afficher
          </div>
        )}
      </div>
    </div>
  );
};
