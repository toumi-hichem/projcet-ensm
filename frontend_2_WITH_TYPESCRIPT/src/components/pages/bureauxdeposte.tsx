// Bureauxdeposte.tsx
import React, { useEffect, useRef, useState } from "react";
import { StatCards } from "../ui/major-centers-stat-cards";
import {
  CartesianGrid,
  CustomLineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "../charts";
import { getModelField, mapping } from "../../data/kpi-mapping";
import {
  type AirportStats,
  type CPXStats,
  type CTNIStats,
  type MajorCenterAllResponse,
  type MajorCenterID,
  type MajorCenterResponse,
  type Office,
  type KPIStat,
  type KPIRep,
} from "../../types";
import type { DashboardStyleType } from "../../styles/dashboardStyles";

/* ---------------------------
  Fetch helpers (kept here for clarity)
   - If you already import these, remove/adjust
---------------------------- */
const fetchMajorCenter = async (
  centerID: MajorCenterID,
): Promise<MajorCenterResponse> => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}center/${centerID}`,
    );

    if (!res.ok) {
      console.error(res.statusText);
      return { success: false, message: res.statusText };
    }

    const data = (await res.json()) as MajorCenterResponse;
    console.log("Got this data from ", centerID, ", data: ", data);
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Network or parsing error" };
  }
};

const fetchHistoryKPIData = async (
  kpiFieldName: keyof AirportStats | keyof CPXStats | keyof CTNIStats,
  centerID: MajorCenterID,
) => {
  const end_date = new Date();
  const start_date = new Date();
  start_date.setFullYear(end_date.getFullYear() - 1);
  console.log("fetchHistoryKPIData called with:");
  console.log("kpiFieldName:", kpiFieldName);
  console.log("centerID:", centerID);
  console.log("start_date:", start_date.toISOString());
  console.log("end_date:", end_date.toISOString());
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}center/${centerID}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpi_field_name: kpiFieldName,
        start_date: start_date.toISOString(),
        end_date: end_date.toISOString(),
        interval: "monthly",
      }),
    },
  );

  if (!res.ok) {
    console.error("Error fetching KPI history:", res.statusText);
    return [];
  }

  const json = await res.json();
  // API might return either { data: [...] } or the array directly, normalize both
  return Array.isArray(json) ? json : (json?.data ?? []);
};

/* ---------------------------
  Local types for UI data
---------------------------- */

/* ---------------------------
  Component
---------------------------- */
interface Props {
  styles: DashboardStyleType;
}
export const Bureauxdeposte = ({ styles }: Props) => {
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedCard, setSelectedCard] = useState<KPIRep | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const historyCache = useRef<Record<string, any[]>>({}); // cache per kpiFieldName
  const isMounted = useRef(true);
  const [data, setData] = useState<MajorCenterAllResponse["data"] | null>(null);
  const [activeStat, setActiveStat] = useState<KPIStat | null>(null);

  useEffect(() => {
    setActiveStat(
      selectedCard
        ? (selectedOffice?.stats.find(
            (stat) => stat.key === selectedCard.key,
          ) ?? null)
        : null,
    );
  }, [offices, selectedCard, selectedOffice?.stats]);

  useEffect(() => {
    const fetchAllData = async () => {
      const data = await fetchMajorCenter("all");
      if (!data.success) {
        console.error("Failed to load data: ", data.message);
        return;
      }
      setData(data.data as MajorCenterAllResponse);
      console.log("got this overall data: ", data.data);
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const centerConfig: {
      id: MajorCenterID;
      name: string;
      location: string;
    }[] = [
      {
        id: "ctni",
        name: "CTNI",
        location: "Centre de Tri National International",
      },
      { id: "cpx", name: "CPX", location: "Centre Postal d'Échange" },
      { id: "airport", name: "Centre Aero Postal", location: "Aéroport" },
    ];

    const loadAllCenters = async () => {
      const loaded: Office[] = [];

      for (const cfg of centerConfig) {
        const res = await fetchMajorCenter(cfg.id);
        if (!res.success || !res.data) {
          // skip if failed
          continue;
        }

        // pick the appropriate object from res.data
        const centerData: CTNIStats | CPXStats | AirportStats | undefined =
          cfg.id === "ctni"
            ? (res.data.ctni as CTNIStats | undefined)
            : cfg.id === "cpx"
              ? (res.data.cpx as CPXStats | undefined)
              : (res.data.airport as AirportStats | undefined);

        if (!centerData) continue;

        const stats: KPIStat[] = [];

        // mapping is expected: { "Display Title": "field_name", ... }
        for (const [title, fieldNameRaw] of Object.entries(mapping)) {
          const fieldName = `${cfg.id}_${fieldNameRaw}`;
          // safely read value from centerData (may be undefined)
          // use `any` indexing to avoid deep TS constraints, but we type-check usage above
          const rawValue = (centerData as any)[fieldName];
          const value =
            rawValue === undefined || rawValue === null ? null : rawValue;

          // fetch history (cached)
          let chartData = historyCache.current[fieldName as string];
          if (!chartData) {
            try {
              // NOTE: cast to union of keys acceptable by fetchHistoryKPIData
              // fieldName strings should be the exact field names used by your backend.
              console.log("fetching with these data: ", fieldName, " and", cfg);
              const hist = await fetchHistoryKPIData(
                fieldName as
                  | keyof CTNIStats
                  | keyof CPXStats
                  | keyof AirportStats,
                cfg.id,
              );
              chartData = hist ?? [];
            } catch (err) {
              console.error("history fetch error", fieldName, err);
              chartData = [];
            }
            historyCache.current[fieldName as string] = chartData;
          }

          stats.push({
            key: fieldName,
            title,
            value,
            color: "#2e75e7ff",
            chartData,
          });
        }

        loaded.push({
          id: cfg.id,
          name: cfg.name,
          location: cfg.location,
          stats,
        });
      }

      if (!isMounted.current) return;
      setOffices(loaded);
      console.log("Loaded data: ", loaded);

      // auto-select first office for convenience (optional)
      if (loaded.length > 0) setSelectedOffice(loaded[0]);
    };

    loadAllCenters();
  }, []);

  const handleOfficeSelect = (office: Office | null) => {
    setSelectedOffice(office);
    setSelectedCard(null);
  };

  const handleCardClick = (kpi: KPIRep) => {
    console.log("DEBUG: [page]", kpi);

    setSelectedCard((prev) => (prev?.index === kpi.index ? null : kpi));
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f8fafc",
        minHeight: "80vh",
        minWidth: "100%",
        marginLeft: "-20px",
      }}
    >
      {/* Office selection buttons */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        {offices.map((office) => (
          <button
            key={office.id}
            onClick={() => handleOfficeSelect(office)}
            style={{
              padding: "15px 25px",
              borderRadius: "10px",
              border:
                selectedOffice?.id === office.id
                  ? "2px solid #3b82f6"
                  : "2px solid #e2e8f0",
              backgroundColor:
                selectedOffice?.id === office.id ? "#3b82f6" : "white",
              color: selectedOffice?.id === office.id ? "white" : "#1e293b",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              minWidth: "200px",
              textAlign: "center",
              boxShadow:
                selectedOffice?.id === office.id
                  ? "0 4px 12px rgba(59,130,246,0.3)"
                  : "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              {office.name}
            </div>
            <div
              style={{
                fontSize: "14px",
                opacity: selectedOffice?.id === office.id ? 0.9 : 0.7,
              }}
            >
              {office.location}
            </div>
          </button>
        ))}
      </div>

      {/* Office detail */}
      {selectedOffice ? (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "25px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e5e5",
          }}
        >
          <StatCards
            office={selectedOffice}
            onCardClick={handleCardClick}
            // selectedCard={selectedCard}
          />

          {/* charts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                border: "1px solid #e5e5e5",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: "320px",
              }}
            >
              <CustomLineChart
                data={selectedOffice.stats[1]?.chartData ?? []}
                title="Évolution mensuelle (exemple)"
                style={{
                  width: "100%",
                  maxWidth: "700px",
                }}
                responsive
              />
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                border: "1px solid #e5e5e5",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: "320px",
              }}
            >
              {activeStat && selectedCard !== null ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                    {activeStat.title ?? "N/A"}
                  </div>

                  <div style={{ flex: 1, width: "100%" }}>
                    <CustomLineChart
                      data={activeStat.chartData ?? []}
                      title={`Évolution — ${
                        selectedOffice.stats.find(
                          (stat) => stat.key === selectedCard.key,
                        )?.title
                      }`}
                      style={{
                        width: "100%",
                        maxWidth: "700px",
                      }}
                      responsive
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis width="auto" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      />
                    </CustomLineChart>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    color: "#3a62e6ff",
                    fontSize: "18px",
                    textAlign: "center",
                  }}
                >
                  Cliquez sur une carte KPI ci-dessus pour voir son graphique
                  d'évolution
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* empty state */
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "60px 25px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e5e5",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 0 }}>📮</div>
          <h3 style={{ fontSize: 20, fontWeight: "bold", color: "#1e293b" }}>
            Aucun bureau sélectionné
          </h3>
          <p style={{ fontSize: 16, color: "#64748b" }}>
            Veuillez sélectionner un centre ci-dessus pour voir ses indicateurs
            et graphiques.
          </p>
        </div>
      )}
    </div>
  );
};

export default Bureauxdeposte;
