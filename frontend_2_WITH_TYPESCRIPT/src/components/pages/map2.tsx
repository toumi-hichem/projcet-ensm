import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
// import { PieChart, BarChart, LineChart } from "../charts";
// import { Kpi } from "../ui";
import { wilayaNumbers, alarmDefinitions, postOffices } from "../constants";

const geoUrl = "/dz.json";

export function AlgeriaMapPage2({ styles }) {
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [selectedWilayaData, setSelectedWilayaData] = useState(null);
  const [selectedWilayaNumber, setSelectedWilayaNumber] = useState(null);
  const [selectedPostOffice, setSelectedPostOffice] = useState("");
  const [postOfficeDropdownOpen, setPostOfficeDropdownOpen] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({
    width: 800,
    height: 600,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wilayasData, setWilayasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadWilayasData = async () => {
      try {
        setLoading(true);
        const response = await fetch("./wilayadata.json");
        if (!response.ok) {
          throw new Error("Failed to load wilayadata.json");
        }
        const data = await response.json();
        setWilayasData(data);
        console.log("Wilaya data loaded:", data);
      } catch (err) {
        console.error("Error loading wilaya data:", err);
        setError("Failed to load wilaya data");
      } finally {
        setLoading(false);
      }
    };

    loadWilayasData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setPostOfficeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const findWilayaData = (wilayaName) => {
    if (!wilayasData || !wilayasData.wilayas) {
      return null;
    }

    let foundWilaya = wilayasData.wilayas.find(
      (w) => w.nom.toLowerCase() === wilayaName.toLowerCase(),
    );

    if (!foundWilaya) {
      foundWilaya = wilayasData.wilayas.find(
        (w) =>
          w.nom.toLowerCase().includes(wilayaName.toLowerCase()) ||
          wilayaName.toLowerCase().includes(w.nom.toLowerCase()),
      );
    }

    return foundWilaya || null;
  };

  const getWilayaName = (geo) => {
    return (
      geo.properties.NAME_1 ||
      geo.properties.name ||
      geo.properties.NAME ||
      geo.properties.wilaya_name ||
      "Unknown"
    );
  };

  const getWilayaNumber = (geo) => {
    const wilayaName = getWilayaName(geo);
    return wilayaNumbers[wilayaName] || "??";
  };

  // Get post offices for selected wilaya
  const getPostOfficesForWilaya = () => {
    if (!selectedWilayaNumber || !postOffices) return [];
    return postOffices[selectedWilayaNumber] || [];
  };

  // Vérifier si la wilaya a des alarmes actives
  const hasActiveAlarms = (wilayaName) => {
    const wilayaData = findWilayaData(wilayaName);
    if (!wilayaData || !wilayaData.alerte) return false;

    return Object.values(wilayaData.alerte).some((value) => value === 1);
  };

  // Obtenir les alarmes actives pour une wilaya
  const getActiveAlarms = (wilayaData) => {
    if (!wilayaData || !wilayaData.alerte) return [];

    return Object.entries(wilayaData.alerte)
      .filter(([key, value]) => value === 1)
      .map(([key]) => ({
        code: key,
        ...alarmDefinitions[key],
      }));
  };

  const getCentroid = (geo) => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    const processCoordinates = (coords) => {
      coords.forEach((point) => {
        if (Array.isArray(point[0])) {
          processCoordinates(point);
        } else {
          const [x, y] = point;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      });
    };

    processCoordinates(geo.geometry.coordinates);
    return [(minX + maxX) / 2, (minY + maxY) / 2];
  };

  const updateMapDimensions = useCallback(() => {
    if (mapContainerRef.current) {
      const { offsetWidth, offsetHeight } = mapContainerRef.current;
      setMapDimensions({
        width: Math.max(offsetWidth, 400),
        height: Math.max(offsetHeight, 300),
      });
    }
  }, []);

  useEffect(() => {
    // Attendre que le composant soit monté avant de calculer les dimensions
    setTimeout(() => updateMapDimensions(), 100);

    const handleResize = () => updateMapDimensions();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebarOpen, updateMapDimensions]);

  const calculateScale = () => {
    const baseScale = 1050;
    const aspectRatio = mapDimensions.width / mapDimensions.height;
    return aspectRatio > 1.5
      ? baseScale * (mapDimensions.height / 400)
      : baseScale * (mapDimensions.width / 600);
  };

  const handleWilayaClick = (geo) => {
    const wilayaName = getWilayaName(geo);
    const wilayaNumber = getWilayaNumber(geo);
    const fullWilayaName = `${wilayaNumber} - ${wilayaName}`;

    setSelectedWilaya(fullWilayaName);
    setSelectedWilayaNumber(wilayaNumber);
    setSelectedPostOffice(""); // Reset post office selection
    setPostOfficeDropdownOpen(false); // Close dropdown
    const wilayaData = findWilayaData(wilayaName);
    setSelectedWilayaData(wilayaData);
  };

  const handlePostOfficeSelect = (postOffice) => {
    setSelectedPostOffice(postOffice);
    setPostOfficeDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="main-content">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              fontSize: "1.2rem",
              color: "#666",
            }}
          >
            Loading wilaya data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="main-content">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              fontSize: "1.2rem",
              color: "#e74c3c",
            }}
          >
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  const activeAlarms = selectedWilayaData
    ? getActiveAlarms(selectedWilayaData)
    : [];
  const currentPostOffices = getPostOfficesForWilaya();

  return (
    <div className="app-container">
      <div className="main-content">
        <div
          style={{
            width: "100%",
            padding: sidebarOpen ? "15px" : "20px",
            boxSizing: "border-box",
            fontFamily: "Arial, sans-serif",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: sidebarOpen ? "1.25fr 1fr" : "1.25fr 1.5fr",
              gap: "20px",
              marginBottom: "20px",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div
                ref={mapContainerRef}
                style={{
                  height: "500px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "white",
                  borderRadius: "15px",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  width: "100%",
                  flex: 1,
                }}
              >
                {/* Post Office Dropdown */}
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    top: "15px",
                    left: "15px",
                    zIndex: 1000,
                    minWidth: "190px",
                  }}
                >
                  <div
                    onClick={() => {
                      if (
                        selectedWilayaNumber &&
                        currentPostOffices.length > 0
                      ) {
                        setPostOfficeDropdownOpen(!postOfficeDropdownOpen);
                      }
                    }}
                    style={{
                      background: selectedWilayaNumber ? "white" : "#f8f9fa",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      cursor:
                        selectedWilayaNumber && currentPostOffices.length > 0
                          ? "pointer"
                          : "not-allowed",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.9rem",
                      color: selectedWilayaNumber ? "#333" : "#999",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      opacity:
                        selectedWilayaNumber && currentPostOffices.length > 0
                          ? 1
                          : 0.6,
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {selectedPostOffice ||
                        (!selectedWilayaNumber
                          ? "Select a wilaya first"
                          : currentPostOffices.length === 0
                            ? "No post offices available"
                            : "Choisi un bureau de poste")}
                    </span>
                    {selectedWilayaNumber && currentPostOffices.length > 0 && (
                      <ChevronDown
                        size={16}
                        style={{
                          transform: postOfficeDropdownOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    )}
                  </div>

                  {postOfficeDropdownOpen && currentPostOffices.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #e0e0e0",
                        borderTop: "none",
                        borderRadius: "0 0 8px 8px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 1001,
                      }}
                    >
                      {currentPostOffices.map((postOffice, index) => (
                        <div
                          key={index}
                          onClick={() => handlePostOfficeSelect(postOffice)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderBottom:
                              index < currentPostOffices.length - 1
                                ? "1px solid #f0f0f0"
                                : "none",
                            fontSize: "0.75rem",
                            color: "#333",
                            backgroundColor:
                              selectedPostOffice === postOffice
                                ? "#f0f8ff"
                                : "transparent",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedPostOffice !== postOffice) {
                              e.target.style.backgroundColor = "#f8f9fa";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedPostOffice !== postOffice) {
                              e.target.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          {postOffice}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: calculateScale(),
                    center: [2.5, 28],
                  }}
                  width={mapDimensions.width}
                  height={mapDimensions.height}
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const wilayaNumber = getWilayaNumber(geo);
                        const centroid = getCentroid(geo);
                        const wilayaName =
                          geo.properties.NAME_1 || geo.properties.name;
                        const isSelected =
                          selectedWilaya && selectedWilaya.includes(wilayaName);
                        const hasAlarms = hasActiveAlarms(wilayaName);

                        return (
                          <React.Fragment key={geo.rsmKey}>
                            <Geography
                              geography={geo}
                              onClick={() => handleWilayaClick(geo)}
                              style={{
                                default: {
                                  fill: hasAlarms ? "#148010ff" : "#148010ff",
                                  stroke: "#000000ff",
                                  strokeWidth: isSelected ? 1.5 : 0.5,
                                  outline: "none",
                                },
                                hover: {
                                  fill: hasAlarms ? "#148010ff" : "#148010ff",
                                  stroke: "#000000ff",
                                  strokeWidth: 1,
                                  cursor: "pointer",
                                  outline: "none",
                                },
                                pressed: {
                                  fill: hasAlarms ? "#148010ff" : "#148010ff",
                                  stroke: "#000000ff",
                                  strokeWidth: 1.5,
                                  outline: "none",
                                },
                              }}
                            />
                            <Marker coordinates={centroid}>
                              <text
                                textAnchor="middle"
                                dy={3}
                                style={{
                                  fontFamily: "Arial, sans-serif",
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                  fill: "white",
                                  pointerEvents: "none",
                                  textShadow: "1px 1px 1px rgba(0,0,0,0.5)",
                                }}
                              >
                                {wilayaNumber}
                              </text>
                              {hasAlarms && (
                                <circle
                                  cx={8}
                                  cy={-8}
                                  r={4}
                                  fill="#fb2424ff"
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              )}
                            </Marker>
                          </React.Fragment>
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
              </div>
            </div>
          </div>

          {/* Section Actions des Alarmes */}

          <style jsx>{`
            .main-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              transition: all 0.3s ease;
              width: 100%;
              margin-left: ${sidebarOpen ? "20px" : "0"};
            }

            .app-container {
              position: relative;
              width: 100%;
              min-height: 100vh;
            }

            @media (max-width: 1200px) {
              .main-content {
                margin-left: ${sidebarOpen ? "200px" : "0"} !important;
              }

              .dashboard-grid {
                grid-template-columns: 1fr !important;
                gap: 15px !important;
              }
            }

            @media (max-width: 768px) {
              .main-content {
                margin-left: 0 !important;
                padding: 10px !important;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default AlgeriaMapPage2;
