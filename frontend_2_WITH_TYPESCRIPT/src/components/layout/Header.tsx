import { useState } from "react";
import type { DashboardStyleType } from "../../styles/dashboardStyles";

const logoUrl = "/poste-algerie-seeklogo.svg";

interface Props {
  setSidebarOpen: (state: boolean) => void;
  sidebarOpen: boolean;
  getPageTitle: () => string;
  styles: DashboardStyleType;
}

function Header({ setSidebarOpen, sidebarOpen, getPageTitle, styles }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const callAPI = async (
    endpoint: string,
    method: string = "GET",
    body?: {
      start: string;
      end: string;
      url: string;
      sleep: number;
    },
  ) => {
    try {
      setLoading(endpoint);
      setMessage(null);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Success: ${data.message || data.status}`);
      } else {
        setMessage(`❌ Error: ${data.error || "Unexpected error"}`);
      }
    } catch (error) {
      setMessage(`⚠️ Network error: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRefresh = () => {
    callAPI("refresh/", "GET");
  };

  const handleRebuild = () => {
    // You can adjust start/end dates as needed
    callAPI("rebuild_snapshots/", "POST", {
      start: "2024-01-01",
      end: "2024-12-31",
      url: "http://localhost:8000/refresh/",
      sleep: 3,
    });
  };

  return (
    <div style={styles.header}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <button
          style={styles.hamburgerBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            marginRight: "10px",
            marginLeft: "-10px",
          }}
        >
          <img
            src={logoUrl}
            alt="Menu"
            style={{
              width: 45,
              height: 45,
              transition: "opacity 0.3s ease",
              opacity: sidebarOpen ? 0 : 1,
              visibility: sidebarOpen ? "hidden" : "visible",
            }}
          />
        </div>
        <h1 style={styles.headerTitle}>{getPageTitle()}</h1>
      </div>

      <div style={styles.headerRight}>
        <input
          type="text"
          style={{ ...styles.searchBox, backgroundColor: "white" }}
          placeholder="Search..."
        />

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          style={{
            ...styles.downloadBtn,
            backgroundColor: "#007BFF",
            color: "white",
            marginLeft: "10px",
            opacity: loading === "refresh/" ? 0.6 : 1,
          }}
          disabled={!!loading}
        >
          {loading === "refresh/" ? "Refreshing..." : "Refresh"}
        </button>

        {/* Create KPIs History Button */}
        <button
          onClick={handleRebuild}
          style={{
            ...styles.downloadBtn,
            backgroundColor: "#28A745",
            color: "white",
            marginLeft: "10px",
            opacity: loading === "rebuild_snapshots/" ? 0.6 : 1,
          }}
          disabled={!!loading}
        >
          {loading === "rebuild_snapshots/"
            ? "Creating..."
            : "Create KPIs History"}
        </button>
      </div>

      {/* Optional message display */}
      {message && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            right: "20px",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            color: message.startsWith("✅") ? "green" : "red",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default Header;
