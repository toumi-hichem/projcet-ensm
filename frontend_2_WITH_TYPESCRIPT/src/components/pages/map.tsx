import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

import { AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { Kpi } from "../ui";
import {
  wilayaNumbers,
  alarmDefinitions,
  postOffices,
  type StateNamesType,
} from "../constants";
import type { OneStateResponse, OneOfficeResponse } from "../../types";
import type { Feature } from "../../types/geojson";

const geoUrl = "/algeria.json";

const fetchStateData = async (
  stateID: string | number,
): Promise<OneStateResponse | { success: false }> => {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}states/${stateID}`,
  );
  if (!res.ok) {
    console.error("Got this error: ", res);
    return { success: false };
  }
  return await res.json();
};

const fetchOfficeData = async (
  officeID: string | number,
): Promise<OneOfficeResponse | { success: false }> => {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}offices/${officeID}`,
  );
  if (!res.ok) {
    console.error("Got this error: ", res);
    return { success: false };
  }
  return await res.json();
};

export function AlgeriaMapPage() {
  const [oneState, setOneState] = useState<OneStateResponse | null>(null);
  const [oneOffice, setOneOffice] = useState<OneOfficeResponse | null>(null);
  const [stateID, setStateID] = useState<number | null>(null);
  const [postOfficeDropdownOpen, setPostOfficeDropdownOpen] = useState(false);
  const [officeID, setOfficeID] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState({
    width: 800,
    height: 600,
  });
  const [sidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize post office list based on stateID
  const postOfficeIDList = useMemo(() => {
    if (!stateID) return null;
    const list = postOffices[stateID.toString() as keyof typeof postOffices];
    return list ?? null;
  }, [stateID]);

  // Load state data
  useEffect(() => {
    const loadOneState = async () => {
      if (!stateID) {
        setOneState(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStateData(stateID);
        if (!data.success) {
          console.error(data?.message ?? "unknown error");
          setError(data?.message ?? "unknown error");
          return;
        }
        setOneState(data as OneStateResponse);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    loadOneState();
  }, [stateID]);

  // Load office data
  useEffect(() => {
    const loadOneOffice = async () => {
      if (!officeID) {
        setOneOffice(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOfficeData(officeID);
        if (!data.success) {
          console.error(data?.message ?? "unknown error");
          setError(data?.message ?? "unknown error");
          return;
        }
        setOneOffice(data as OneOfficeResponse);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    loadOneOffice();
  }, [officeID]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setPostOfficeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function getWilayaName(geo: Feature): StateNamesType | "Unknown" {
    const name = (geo.properties.NAME_1 || "Unknown") as
      | StateNamesType
      | "Unknown";
    return name;
  }

  function getWilayaNumber(geo: Feature): string {
    const wilayaName = getWilayaName(geo);
    if (wilayaName === "Unknown") return "??";
    return wilayaNumbers[wilayaName];
  }

  function getCentroid(geo: Feature): [number, number] {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    const processCoordinates = (coords: any) => {
      coords.forEach((point: any) => {
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
  }

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

  const handleStateClick = (geo: Feature) => {
    const newStateID = parseInt(geo.properties.CC_1);
    setStateID(newStateID);
    setOfficeID(null); // Reset office selection when changing state
    setOneOffice(null); // Clear office data
    setPostOfficeDropdownOpen(false);
  };

  const handlePostOfficeSelect = (postOffice: string) => {
    setOfficeID(postOffice);
    setPostOfficeDropdownOpen(false);
  };

  // Determine which data to display
  const displayData = oneOffice?.office || oneState?.state || null;
  const alerts = oneOffice?.alerts || oneState?.alerts || [];
  const activeAlarms = alerts.filter((a) => !a.acknowledged);

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
            Loading data...
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
              {oneState && (
                <div
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "15px 20px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderLeft: `4px solid ${activeAlarms.length > 0 ? "#ef4444" : "#e0f7fa"}`,
                  }}
                >
                  <div style={{ fontSize: "1.5rem", opacity: 0.8 }}>
                    {activeAlarms.length > 0 ? "⚠️" : "📍"}
                  </div>
                  <div style={{ color: "#2c3e50", fontSize: "1rem", flex: 1 }}>
                    <strong style={{ color: "#3498db" }}>Selected:</strong>{" "}
                    {oneOffice ? officeID : oneState.state.name}
                    {activeAlarms.length > 0 && (
                      <div
                        style={{
                          color: "#ef4444",
                          fontSize: "0.9rem",
                          marginTop: "4px",
                          fontWeight: "500",
                        }}
                      >
                        {activeAlarms.length} alarme(s) active(s)
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                      if (postOfficeIDList && postOfficeIDList.length > 0) {
                        setPostOfficeDropdownOpen(!postOfficeDropdownOpen);
                      }
                    }}
                    style={{
                      background: stateID ? "white" : "#f8f9fa",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      cursor:
                        stateID &&
                        postOfficeIDList &&
                        postOfficeIDList.length > 0
                          ? "pointer"
                          : "not-allowed",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.9rem",
                      color: stateID ? "#333" : "#999",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      opacity:
                        stateID &&
                        postOfficeIDList &&
                        postOfficeIDList.length > 0
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
                      {officeID ||
                        (!stateID
                          ? "Select a wilaya first"
                          : postOfficeIDList && postOfficeIDList.length === 0
                            ? "No post offices available"
                            : "Choisi un bureau de poste")}
                    </span>
                    {stateID &&
                      postOfficeIDList &&
                      postOfficeIDList.length > 0 && (
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

                  {postOfficeDropdownOpen &&
                    postOfficeIDList &&
                    postOfficeIDList.length > 0 && (
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
                        {postOfficeIDList.map((postOffice, index) => (
                          <div
                            key={index}
                            onClick={() => handlePostOfficeSelect(postOffice)}
                            style={{
                              padding: "10px 12px",
                              cursor: "pointer",
                              borderBottom:
                                index < postOfficeIDList.length - 1
                                  ? "1px solid #f0f0f0"
                                  : "none",
                              fontSize: "0.75rem",
                              color: "#333",
                              backgroundColor:
                                officeID === postOffice
                                  ? "#f0f8ff"
                                  : "transparent",
                              transition: "background-color 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (officeID !== postOffice) {
                                (
                                  e.target as HTMLDivElement
                                ).style.backgroundColor = "#f8f9fa";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (officeID !== postOffice) {
                                (
                                  e.target as HTMLDivElement
                                ).style.backgroundColor = "transparent";
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
                      geographies.map((geo: Feature) => {
                        const geoStateID = parseInt(geo.properties.CC_1);
                        const centroid = getCentroid(geo);
                        const isSelected = stateID === geoStateID;

                        // Check if this specific state has alarms
                        const stateHasAlarms =
                          isSelected && activeAlarms.length > 0;

                        return (
                          <React.Fragment key={geo.rsmKey}>
                            <Geography
                              geography={geo}
                              onClick={() => handleStateClick(geo)}
                              style={{
                                default: {
                                  fill: "#148010ff",
                                  stroke: "#000000ff",
                                  strokeWidth: isSelected ? 1.5 : 0.5,
                                  outline: "none",
                                },
                                hover: {
                                  fill: "#1a9912ff",
                                  stroke: "#000000ff",
                                  strokeWidth: 1,
                                  cursor: "pointer",
                                  outline: "none",
                                },
                                pressed: {
                                  fill: "#148010ff",
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
                                {getWilayaNumber(geo)}
                              </text>
                              {stateHasAlarms && (
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {displayData ? (
                <div
                  style={{
                    background: "white",
                    borderRadius: "15px",
                    padding: "20px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                    border: "2px solid rgba(0,0,0,0.05)",
                    maxHeight: "568px",
                    overflowY: "auto",
                    flex: 2,
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 15px 0",
                      color: "#2c3e50",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      borderBottom: "2px solid #ecf0f1",
                      paddingBottom: "8px",
                    }}
                  >
                    {oneOffice
                      ? `${officeID} - Statistiques`
                      : `${oneState?.state.name ?? "Unknown"} - Statistiques`}
                  </h3>

                  {/* Selected Post Office Display */}
                  {officeID && oneOffice && (
                    <div
                      style={{
                        background: "#f0f8ff",
                        border: "1px solid #b3d9ff",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "15px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#0066cc",
                          fontWeight: "600",
                        }}
                      >
                        <CheckCircle size={16} />
                        Bureau de Poste Sélectionné
                      </div>
                      <div
                        style={{
                          color: "#333",
                          fontSize: "0.9rem",
                          marginTop: "4px",
                          fontWeight: "500",
                        }}
                      >
                        {officeID}
                      </div>
                    </div>
                  )}

                  {/* Section des Alarmes */}
                  {activeAlarms.length > 0 && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "15px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          color: "#dc2626",
                          fontWeight: "600",
                        }}
                      >
                        <AlertTriangle size={16} />
                        Alarmes Actives ({activeAlarms.length})
                      </div>
                      {activeAlarms.map((alarm) => (
                        <div
                          key={alarm.id}
                          style={{
                            background: "white",
                            padding: "8px",
                            borderRadius: "4px",
                            marginBottom: "6px",
                            fontSize: "0.85rem",
                          }}
                        >
                          <div style={{ fontWeight: "600", color: "#dc2626" }}>
                            {alarm.alarm_code}: {alarm.title}
                          </div>
                          <div style={{ color: "#666", marginTop: "2px" }}>
                            {alarm.trigger_condition}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "14px",
                    }}
                  >
                    <Kpi
                      title="nombre de dépèches pré-arrivé"
                      value={displayData.pre_arrived_dispatches_count}
                      style={{
                        backgroundColor: "#3B82F6",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                        minHeight: "80px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    />
                    <Kpi
                      title="nombre d'envoi livrés"
                      value={displayData.items_delivered}
                      style={{
                        backgroundColor: "#3B82F6",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                        minHeight: "80px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    />
                    <Kpi
                      title="nombre d'envois non-livrés"
                      value={displayData.undelivered_items}
                      style={{
                        backgroundColor: "#3B82F6",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                        minHeight: "80px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "white",
                    borderRadius: "15px",
                    padding: "40px 20px",
                    boxShadow: "0 8px 25px rgba(0, 238, 255, 0.3)",
                    textAlign: "center",
                    color: "#00eeff",
                    border: "2px dashed #0099ff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      marginBottom: "15px",
                      opacity: 0.5,
                    }}
                  >
                    📊
                  </div>
                  <p style={{ margin: 0, fontSize: "1.1rem" }}>
                    Select a wilaya to view analytics
                  </p>
                </div>
              )}
            </div>
          </div>

          <style>{`
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
