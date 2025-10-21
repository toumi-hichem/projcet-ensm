// Bureauxdeposte.tsx
import React, { useEffect, useRef, useState } from "react";
import { StatCards } from "../ui";
import {
  CartesianGrid,
  CustomLineChart,
  Line,
  CustomLineChart as LineChart,
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
} from "../../types";

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
type KPIStat = {
  title: string;
  value: number | string | null;
  color: string;
  chartData: any[]; // shape depends on your LineChart; keep flexible
};

type Office = {
  id: MajorCenterID;
  name: string;
  location: string;
  stats: KPIStat[];
};

/* ---------------------------
  Component
---------------------------- */
export const Bureauxdeposte: React.FC = () => {
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const historyCache = useRef<Record<string, any[]>>({}); // cache per kpiFieldName
  const isMounted = useRef(true);
  const [data, setData] = useState<MajorCenterAllResponse["data"] | null>(null);

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

  const handleCardClick = (index: number) => {
    setSelectedCard((prev) => (prev === index ? null : index));
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
            stats={
              selectedOffice.id === "airport"
                ? data?.airport
                : selectedOffice.id === "cpx"
                  ? data?.cpx
                  : data?.ctni
            }
            onCardClick={(stat, idx) => handleCardClick(idx)}
            selectedCard={selectedCard}
            setSelectedCard={(idx: number | null) => setSelectedCard(idx)}
          />

          {/* charts */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "stretch",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "19px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e5e5",
                flex: 1.5,
                height: "250px",
                display: "flex",
              }}
            >
              <LineChart
                data={selectedOffice.stats[1]?.chartData ?? []}
                title="Évolution mensuelle (exemple)"
                showLabels={true}
              />
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "19px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e5e5",
                flex: 1.5,
                height: "250px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selectedCard !== null ? (
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
                    {selectedOffice.stats[selectedCard].title}
                  </div>

                  <div style={{ flex: 1, width: "100%" }}>
                    <LineChart
                      data={selectedOffice.stats[selectedCard].chartData ?? []}
                      title={`Évolution — ${selectedOffice.stats[selectedCard].title}`}
                      showLabels={true}
                    />
                    <CustomLineChart
                      style={{
                        width: "100%",
                        maxWidth: "700px",
                        maxHeight: "70vh",
                        aspectRatio: 1.618,
                      }}
                      responsive
                      data={selectedOffice.stats[selectedCard].chartData ?? []}
                      margin={{
                        top: 5,
                        right: 0,
                        left: 0,
                        bottom: 5,
                      }}
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
