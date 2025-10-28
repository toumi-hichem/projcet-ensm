import type { DashboardStyleType } from "../../styles/dashboardStyles";
import type { Pages } from "../../types";

const logoUrl = "/poste-algerie-seeklogo.svg";
interface Props {
  sidebarOpen: boolean;
  activeTab: Pages;
  showPage: (state: Pages) => void;
  closeSidebar: () => void;
  styles: DashboardStyleType;
}
function Sidebar({
  sidebarOpen,
  activeTab,
  showPage,
  closeSidebar,
  styles,
}: Props) {
  if (!sidebarOpen) return null;

  const handlePageChange = (page: Pages) => {
    showPage(page);
    closeSidebar(); // Close sidebar after changing page
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center", // horizontal center
          alignItems: "center", // vertical center
          height: "60px",
          marginBottom: "20px", // adjust to your sidebar header height
        }}
      >
        <img src={logoUrl} alt="Menu" style={{ width: 60, height: 60 }} />
      </div>
      <nav>
        <button
          style={
            activeTab === "dashboard" ? styles.menuItemActive : styles.menuItem
          }
          onClick={() => handlePageChange("dashboard")}
          onMouseEnter={(e) => {
            if (activeTab !== "dashboard") {
              e.target.style.backgroundColor = "#f1f5f9";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "dashboard") {
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          Tableau de bord
        </button>
        <button
          style={
            activeTab === "algeriamap" ? styles.menuItemActive : styles.menuItem
          }
          onClick={() => handlePageChange("algeriamap")}
          onMouseEnter={(e) => {
            if (activeTab !== "algeriamap") {
              e.target.style.backgroundColor = "#f1f5f9";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "algeriamap") {
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          Carte d'algerie
        </button>
        <button
          style={
            activeTab === "bureauxdeposte"
              ? styles.menuItemActive
              : styles.menuItem
          }
          onClick={() => handlePageChange("bureauxdeposte")}
          onMouseEnter={(e) => {
            if (activeTab !== "bureauxdeposte") {
              e.target.style.backgroundColor = "#f1f5f9";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "bureauxdeposte") {
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          Bureaux de poste
        </button>
        <button
          style={
            activeTab === "upload" ? styles.menuItemActive : styles.menuItem
          }
          onClick={() => handlePageChange("upload")}
          onMouseEnter={(e) => {
            if (activeTab !== "upload") {
              e.target.style.backgroundColor = "#f1f5f9";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "upload") {
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          Upload
        </button>
        {/* <button
          style={activeTab === 'map2' ? styles.menuItemActive : styles.menuItem}
          onClick={() => handlePageChange('map2')}
          onMouseEnter={(e) => {
            if (activeTab !== 'map2') {
              e.target.style.backgroundColor = '#f1f5f9';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'map2') {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          map2
        </button> */}
      </nav>
    </>
  );
}

export default Sidebar;
