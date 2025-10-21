import { useState } from "react";
import { dashboardStyles } from "./styles/dashboardStyles";
import { Sidebar } from "./components";
import {
  Header,
  DashboardPage,
  AlgeriaMapPage,
  Bureauxdeposte,
  AlgeriaMapPage2,
} from "./components";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const showPage = (page) => {
    setActiveTab(page);
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: "Dashboard",
      bureauxdeposte: "Bureaux de poste",
      algeriamap: "Algeria Map",
      map2: "Map 2",
    };
    return titles[activeTab];
  };

  const sidebarStyle = {
    ...dashboardStyles.sidebar,
    ...(sidebarOpen ? {} : dashboardStyles.sidebarCollapsed),
  };

  return (
    <div style={dashboardStyles.dashboard}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <Sidebar
          sidebarOpen={sidebarOpen}
          activeTab={activeTab}
          showPage={showPage}
          closeSidebar={closeSidebar}
          styles={dashboardStyles}
        />
      </div>

      {/* Main Content */}
      <div style={dashboardStyles.mainContent}>
        {/* Header */}
        <Header
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
          getPageTitle={getPageTitle}
          styles={dashboardStyles}
        />

        {/* Content */}
        <div style={dashboardStyles.content}>
          {activeTab === "dashboard" && (
            <DashboardPage styles={dashboardStyles} />
          )}
          {activeTab === "algeriamap" && (
            <AlgeriaMapPage styles={dashboardStyles} />
          )}
          {activeTab === "bureauxdeposte" && (
            <Bureauxdeposte styles={dashboardStyles} />
          )}
          {activeTab === "map2" && <AlgeriaMapPage2 styles={dashboardStyles} />}
        </div>
      </div>
    </div>
  );
}
export default App;
