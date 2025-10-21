import React, { useState } from "react";
import { StatCards, Top10List } from "../ui";
import { BarChart, LineChart } from "../charts";
// import { stats } from '../constants'
import { useEffect } from "react";

const fetchDashboardData = async () => {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard/`);
  if (!res.ok) {
    return {
      sucess: false,
    };
  }
  return res.data;
};
const fetchHistoryKPIData = async (kpiFieldName) => {
  const end_date = new Date();
  const start_date = new Date();
  start_date.setFullYear(end_date.getFullYear() - 1);

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard`, {
    method: "POST",
    body: {
      kpi_field_name: kpiFieldName,
      start_date: start_date.toISOString(),
      end_date: end_date.toISOString(),
      interval: "monthly",
    },
  });
  if (!res.ok) {
    return {
      success: false,
    };
  }
  return res.data;
};
const getstates = async (path) => {
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

function DashboardPage({ styles }) {
  // State to manage which stat card is selected
  const [selectedCard, setSelectedCard] = useState(null);
  const [stats, setStats] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const data = await getstates("/donnees_algerie.json");
      // const data = await fetchDashboardData();
      setStats(data);
    };
    fetchData();
  }, []);

  console.log(stats);

  // Handle card clicks
  const handleCardClick = (selectedStat, selectedIndex) => {
    setSelectedCard(selectedIndex); // <-- This updates the selected card!
  };

  // const pieColors = ['#2e75e7ff', '#6366f1', '#8b5cf6', '#06b6d4', '#0891b2'];

  return (
    <div>
      <StatCards
        stats={stats}
        onCardClick={handleCardClick}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
      />

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
            height: "260px",
            display: "flex",
          }}
        >
          <LineChart
            data={stats[4]?.chartData}
            title="Evolution Mensuelle du taux de livraison"
            showLabels={true}
          />
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
            height: "260px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selectedCard !== null ? (
            <div
              style={{
                width: "150%",
                height: "150%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "45px" }}>
                {stats[selectedCard].title}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#000000ff",
                  marginBottom: "10px",
                }}
              >
                Evolution mensuelle : {stats[selectedCard].title}
              </div>

              {/* Make the chart fill the available space */}
              <div
                style={{
                  flex: 1,
                  width: "100%",
                  display: "flex",
                }}
              >
                <LineChart
                  data={stats[selectedCard].chartData}
                  title=""
                  showLabels={true}
                  style={{ width: "100%", height: "100%" }}
                />
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
            data={stats[13]?.chartData}
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
          <BarChart
            data={stats[15]?.chartData}
            styles={styles}
            title="collis livrés"
          />
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
            data={stats[14]?.chartData}
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

export default DashboardPage;
