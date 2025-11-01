import { useEffect, useState } from "react";
import { DataPanel, MapContainer } from "../map-components";
import type {
  OneStateResponse,
  OneOfficeResponse,
  StatePostalOfficeResponse,
  Alert,
} from "../../types";

const geoUrl = "/algeria.json";

export const AlgeriaMapPage = () => {
  const [states, setStates] = useState<StatePostalOfficeResponse | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [stateData, setStateData] = useState<OneStateResponse | null>(null);
  const [officeData, setOfficeData] = useState<OneOfficeResponse | null>(null);

  const updateAlerts = (updater: (prev: Alert[]) => Alert[]) => {
    if (officeData) {
      setOfficeData({ ...officeData, alerts: updater(officeData.alerts) });
    } else if (stateData) {
      setStateData({ ...stateData, alerts: updater(stateData.alerts) });
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}state-office/`)
      .then((r) => r.json())
      .then(setStates);
  }, []);

  useEffect(() => {
    if (!selectedState) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}states/${selectedState}`)
      .then((r) => r.json())
      .then(setStateData);
  }, [selectedState]);

  useEffect(() => {
    if (!selectedOffice) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}offices/${selectedOffice}`)
      .then((r) => r.json())
      .then(setOfficeData);
  }, [selectedOffice]);

  const handleStateClick = (geo: any) => {
    const id = parseInt(geo.properties.CC_1);
    setSelectedState(id);
    setSelectedOffice(null);
    setOfficeData(null);
  };

  const handleOfficeSelect = (id: string) => {
    setSelectedOffice(id);
    setStateData(null);
  };

  const activeAlarms = officeData?.alerts ?? stateData?.alerts ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
      <div>
        <MapContainer
          geoUrl={geoUrl}
          selectedStateId={selectedState}
          activeAlarmsCount={activeAlarms.filter((a) => !a.acknowledged).length}
          onStateClick={handleStateClick}
          offices={
            states?.data.find((s) => s.id === selectedState)?.postal_offices ||
            []
          }
          selectedOfficeId={selectedOffice}
          onSelectOffice={handleOfficeSelect}
        />
      </div>

      <div>
        {officeData ? (
          <DataPanel
            title={
              states?.data
                .flatMap((s) => s.postal_offices)
                .find((o) => o.id.toString() === selectedOffice)?.name ??
              "Office data unavailable"
            }
            stats={officeData.office}
            alerts={officeData.alerts}
            setAlerts={updateAlerts}
          />
        ) : stateData ? (
          <DataPanel
            title={
              states?.data.find((s) => s.id === selectedState)?.name ??
              "State data unavailable"
            }
            stats={stateData.state}
            alerts={stateData.alerts}
            setAlerts={updateAlerts}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              background: "white",
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              padding: 30,
            }}
          >
            <h3
              style={{
                color: "black",
                fontSize: "1.2rem",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              No region selected
            </h3>
            <p
              style={{
                color: "black",
                fontSize: "0.95rem",
                opacity: 0.75,
                textAlign: "center",
                maxWidth: 240,
              }}
            >
              Select a <strong>wilaya</strong> or a{" "}
              <strong>postal office</strong> on the map to view its live data
              and alerts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
