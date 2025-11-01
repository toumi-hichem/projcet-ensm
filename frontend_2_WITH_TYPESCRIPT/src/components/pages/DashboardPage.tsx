import React, { useState } from "react";
import { StatCards, Top10List } from "../ui";
import { BarChart } from "../charts";
import {
  CustomLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "../charts";
// import { stats } from '../constants'
import { useEffect } from "react";
import type {
  Dashboard,
  KPIHistory,
  KPIRep,
  SelectedCardType,
} from "../../types";
import { KPI_TO_TITLE_AND_COLOR } from "../constants/kpi_titles";
import type { DashboardStyleType } from "../../styles/dashboardStyles";
import { KpiCard } from "../ui/kpi-card";

const fetchDashboardData = async () => {
  console.log("fetching data");
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}dashboard/`);
  if (!res.ok) {
    console.error("Got this error: ", res);
    return {
      sucess: false,
    };
  }
  const data = await res.json();
  console.log("data: ", data);
  return data;
};
const fetchHistoryKPIData = async (kpiFieldName: keyof Dashboard) => {
  const start_date = new Date("2021-12-11");
  const end_date = new Date("2025-05-19");

  // start_date.setFullYear(end_date.getFullYear() - 1);

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}dashboard/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // 👈 Important
    },
    body: JSON.stringify({
      kpi_field_name: kpiFieldName,
      start_date: start_date.toISOString(),
      end_date: end_date.toISOString(),
      interval: "monthly",
    }),
  });
  if (!res.ok) {
    console.error("Error fetching KPI data:", res.statusText);

    return {
      success: false,
    };
  }
  const data = await res.json();
  return data;
};
const getstates = async (path: string) => {
  const response = await fetch(path);
  const data = await response.json();
  const other = data.donnees.other;
  const kpi = data.donnees.kpi;

  const mapping = {
    "Nombre de dépêches pré-arrivées": "data1",
    "Nombre denvois livrés": "success_count",
    "Nombre denvois livrés dès la première tentative (1 échec)": "data3",
    "Nombre denvois non livrés": "failure_count",
    "Taux de livraison": "success_rate_all",
    "Taux de livraison dans les délais": "on_time_delivery_rate_all",
    "Nombre denvois en dépassement du délai de garde": "data7",
    "Nombre denvois bloqués en douane": "data8",
    "Nombre denvois retournés": "data9",
    "Délai de concentration": "data10",
    "Délai dacheminement des envois de bout en bout": "avg_duration_str",
    "Délai de concentration des envois": "data12",
    "Nombre denvois non scannés": "data13",
  };

  const color = "#2e75e7ff";

  const stats = [];

  for (const [title, datakey] of Object.entries(mapping)) {
    const value = kpi[title];
    const chartData = kpi[datakey] || [];
    stats.push({
      title,
      value,
      color,
      chartData,
    });
  }

  stats.push({
    title: "Top Cities",
    chartData: other.topcities || [],
  });

  stats.push({
    title: "Worst Cities",
    chartData: other.worstcities || [],
  });

  stats.push({
    title: "Bar Data",
    chartData: other.bardata || [],
  });

  return stats;
};
interface Props {
  styles: DashboardStyleType;
}
export function DashboardPage({ styles }: Props) {
  // State to manage which stat card is selected
  const [selectedCard, setSelectedCard] = useState<SelectedCardType>(null);
  const [stats, setStats] = useState<Dashboard>();
  const [selectedCardData, setSelectedCardData] = useState<KPIHistory[] | null>(
    null,
  );
  const [rightSelectedCardData, setRightSelectedCardData] = useState<
    KPIHistory[] | null
  >(null);
  const topCities: {
    name: string;
    taux_de_livraison: number;
  }[] = [
    {
      name: "Algiers",
      taux_de_livraison: 80,
    },
    {
      name: "Oran",
      taux_de_livraison: 75,
    },
    {
      name: "Constantine",
      taux_de_livraison: 70,
    },
    {
      name: "Annaba",
      taux_de_livraison: 63,
    },
    {
      name: "Blida",
      taux_de_livraison: 62,
    },
    {
      name: "Batna",
      taux_de_livraison: 60,
    },
    {
      name: "Djelfa",
      taux_de_livraison: 59,
    },
    {
      name: "Sétif",
      taux_de_livraison: 54,
    },
    {
      name: "Sidi Bel Abbès",
      taux_de_livraison: 52,
    },
    {
      name: "Biskra",
      taux_de_livraison: 50,
    },
    {
      name: "Tébessa",
      taux_de_livraison: 49,
    },
    {
      name: "Tlemcen",
      taux_de_livraison: 48,
    },
  ];
  const worstCities: {
    name: string;
    taux_de_livraison: number;
  }[] = [
    {
      name: "Algiers",
      taux_de_livraison: 10,
    },
    {
      name: "Oran",
      taux_de_livraison: 9,
    },
    {
      name: "Constantine",
      taux_de_livraison: 8,
    },
    {
      name: "Annaba",
      taux_de_livraison: 7,
    },
    {
      name: "Blida",
      taux_de_livraison: 6,
    },
    {
      name: "Batna",
      taux_de_livraison: 5,
    },
    {
      name: "Djelfa",
      taux_de_livraison: 4,
    },
    {
      name: "Sétif",
      taux_de_livraison: 3,
    },
    {
      name: "Sidi Bel Abbès",
      taux_de_livraison: 2,
    },
    {
      name: "Biskra",
      taux_de_livraison: 1,
    },
    {
      name: "Tébessa",
      taux_de_livraison: 0.5,
    },
    {
      name: "Tlemcen",
      taux_de_livraison: 0.1,
    },
  ];
  const bardData: {
    day: string;
    delivered: number;
    failed: number;
  }[] = [
    {
      day: "Mon",
      delivered: 60,
      failed: 30,
    },
    {
      day: "Tue",
      delivered: 80,
      failed: 20,
    },
    {
      day: "Wed",
      delivered: 70,
      failed: 25,
    },
    {
      day: "Thu",
      delivered: 90,
      failed: 35,
    },
    {
      day: "Fri",
      delivered: 75,
      failed: 15,
    },
    {
      day: "Sat",
      delivered: 65,
      failed: 25,
    },
  ];
  useEffect(() => {
    console.log("Selected card: ", selectedCard);
    if (!selectedCard) {
      setSelectedCardData(null);
      return;
    }
    const fetchData = async () => {
      const data: {
        success: boolean;
        data: KPIHistory[];
      } = await fetchHistoryKPIData(selectedCard?.key);
      if (data.success) {
        console.log("setting linechart data to: ", data.data);
        setSelectedCardData(data.data);
      } else {
        console.error("Failed to set data, ");
      }
    };
    fetchData();
  }, [selectedCard]);

  useEffect(() => {
    const fetchData = async () => {
      // const data = await getstates("/donnees_algerie.json");
      const data: {
        success: boolean;
        data: Dashboard;
      } = await fetchDashboardData();
      setStats(data.data);
    };
    const fetchRightChart = async () => {
      const data: {
        success: boolean;
        data: KPIHistory[];
      } = await fetchHistoryKPIData("delivery_rate");
      if (!data.success) return;
      console.log("setting left linechart data to: ", data.data);
      setRightSelectedCardData(data.data);
    };
    fetchRightChart();
    fetchData();
  }, []);

  console.log(stats);

  // Handle card clicks
  const handleCardClick = (kpi: KPIRep) => {
    setSelectedCard({
      key: kpi.key,
      index: kpi.index,
    }); // <-- This updates the selected card!
  };

  // const pieColors = ['#2e75e7ff', '#6366f1', '#8b5cf6', '#06b6d4', '#0891b2'];

  return (
    <div>
      {/*<StatCards
        stats={stats}
        onCardClick={handleCardClick}
        selectedCard={selectedCard}
      />*/}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {stats &&
          Object.entries(stats).map(([key, value], index) => {
            console.log("key: ", key);
            if (key === "id") {
              console.log("key:|||||||||||||| ", key);

              return;
            }
            let onClickFunction;
            if (key != "timestamp") {
              onClickFunction = handleCardClick;
            }
            return (
              <KpiCard
                key={key}
                title={key} // or map to a prettier label if needed
                value={value ?? "N/A"} // your formatter
                onCardClick={onClickFunction}
                kpiKey={key}
                index={index}
              />
            );
          })}
      </div>
      // Replace the chart section in your DashboardPage with this:
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "stretch",
          marginBottom: "10px",
        }}
      >
        {/* Main LineChart block (left) */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "19px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e5e5",
            flex: 1.5,
            minHeight: "260px", // Use minHeight instead of height
            display: "flex",
            minWidth: 0, // CRITICAL: Allows flex child to shrink
          }}
        >
          {/*<LineChart
            data={stats[4]?.chartData}
            title="Evolution Mensuelle du taux de livraison"
            showLabels={true}
          />*/}
          {rightSelectedCardData && rightSelectedCardData.length > 0 ? (
            <CustomLineChart
              style={{
                width: "100%",
                maxWidth: "700px",
                maxHeight: "70vh",
                aspectRatio: 1.618,
              }}
              responsive
              data={rightSelectedCardData}
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
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#6B7280",
              }}
            >
              Loading chart data...
            </div>
          )}
        </div>

        {/* Selected stat chart block (right) */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "19px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e5e5",
            flex: 1.5,
            minHeight: "260px", // Use minHeight instead of height
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0, // CRITICAL: Allows flex child to shrink
          }}
        >
          {selectedCard ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 0, // CRITICAL
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "16px" }}>
                {KPI_TO_TITLE_AND_COLOR[selectedCard.key]?.title}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#000000ff",
                  marginBottom: "10px",
                }}
              >
                Evolution mensuelle :{" "}
                {KPI_TO_TITLE_AND_COLOR[selectedCard.key]?.title}
              </div>

              {/* Chart container with proper sizing */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "200px",
                  minWidth: 0, // CRITICAL
                }}
              >
                {selectedCardData && selectedCardData.length > 0 ? (
                  <CustomLineChart
                    style={{
                      width: "100%",
                      maxWidth: "700px",
                      maxHeight: "70vh",
                      aspectRatio: 1.618,
                    }}
                    responsive
                    data={selectedCardData}
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
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#6B7280",
                    }}
                  >
                    Loading chart data...
                  </div>
                )}
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
              Click on a stat card above to view its evolution chart
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "stretch",
          marginBottom: "20px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e5e5",
            flex: 1,
            height: "290px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Top10List
            title="willayas avec le meiller taux de livraisons"
            data={topCities}
            labelKey="name"
            valueKey="taux_de_livraison"
            showNumbers={true}
            showValues={true}
          />
        </div>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "19px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e5e5",
            flex: 1,
            height: "292px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BarChart data={bardData} styles={styles} title="collis livrés" />
        </div>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e5e5",
            flex: 1,
            height: "290px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Top10List
            title="willayas avec le meiller taux de livraisons"
            data={worstCities}
            labelKey="name"
            valueKey="taux_de_livraison"
            showNumbers={true}
            showValues={true}
          />
        </div>
      </div>
    </div>
  );
}
