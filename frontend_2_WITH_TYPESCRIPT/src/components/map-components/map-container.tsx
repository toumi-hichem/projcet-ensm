import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { Feature } from "../../types";
import { PostOfficeDropdown } from "./postal-office-dropdown";
import type { PostalOffice } from "../../types";

interface MapContainerProps {
  geoUrl: string;
  selectedStateId: number | null;
  activeAlarmsCount: number;
  onStateClick: (geo: Feature) => void;
  offices: PostalOffice[];
  selectedOfficeId: string | null;
  onSelectOffice: (officeId: string) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  geoUrl,
  selectedStateId,
  activeAlarmsCount,
  onStateClick,
  offices,
  selectedOfficeId,
  onSelectOffice,
}) => {
  const [position, setPosition] = useState({
    coordinates: [1, 29], // slightly north-centered
    zoom: 10.2, // start zoomed in
  });

  const handleMoveEnd = (pos: any) => setPosition(pos);

  const handleZoomIn = () =>
    setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.3, 20) }));

  const handleZoomOut = () =>
    setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.3, 1) }));

  const getCentroid = (geo: Feature): [number, number] => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    const processCoords = (coords: any) => {
      coords.forEach((p: any) => {
        if (Array.isArray(p[0])) processCoords(p);
        else {
          const [x, y] = p;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      });
    };
    processCoords(geo.geometry.coordinates);
    return [(minX + maxX) / 2, (minY + maxY) / 2];
  };

  const scaleFactor = 1 / position.zoom;

  return (
    <div
      style={{
        position: "relative",
        background: "white",
        borderRadius: 12,
        padding: 10,
      }}
    >
      {/* Dropdown */}
      <div
        style={{
          position: "absolute",
          top: 15,
          left: 15,
          zIndex: 10,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <PostOfficeDropdown
          offices={offices}
          selectedOfficeId={selectedOfficeId}
          onSelect={onSelectOffice}
        />
      </div>

      {/* Zoom Controls */}
      <div
        style={{
          position: "absolute",
          top: 15,
          right: 15,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "6px 8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "6px 8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          −
        </button>
      </div>

      <ComposableMap projection="geoMercator">
        <ZoomableGroup
          center={position.coordinates as [number, number]}
          zoom={position.zoom}
          minZoom={10}
          maxZoom={40}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo: Feature) => {
                const centroid = getCentroid(geo);
                const isSelected =
                  selectedStateId === parseInt(geo.properties.CC_1);

                return (
                  <React.Fragment key={geo.rsmKey}>
                    <Geography
                      geography={geo}
                      onClick={() => onStateClick(geo)}
                      style={{
                        default: {
                          fill: isSelected ? "#1E90FF" : "#F5F7FA", // vivid blue when selected, soft gray otherwise
                          stroke: isSelected ? "#004E98" : "#B0BEC5", // subtle border difference
                          strokeWidth: isSelected ? 0.06 : 0.03,
                          outline: "none",
                          transition: "fill 0.3s ease, stroke 0.3s ease",
                        },
                        hover: {
                          fill: "#64B5F6", // lighter sky-blue hover
                          cursor: "pointer",
                          stroke: "#1565C0", // slightly darker stroke for emphasis
                          strokeWidth: 0.08,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#1976D2", // medium blue when clicked
                          outline: "none",
                          stroke: "#0D47A1",
                          strokeWidth: 0.08,
                        },
                      }}
                    />

                    <Marker coordinates={centroid}>
                      <g transform={`scale(${scaleFactor})`}>
                        <text
                          dy={3}
                          textAnchor="middle"
                          fontSize={9}
                          fill="white"
                          stroke="black"
                          strokeWidth={0.11}
                        >
                          {geo.properties.CC_1}
                        </text>
                        {isSelected && activeAlarmsCount > 0 && (
                          <circle
                            cx={8}
                            cy={-8}
                            r={4}
                            fill="#fb2424"
                            stroke="white"
                            strokeWidth={0.2}
                          />
                        )}
                      </g>
                    </Marker>
                  </React.Fragment>
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};
