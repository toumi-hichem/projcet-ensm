// GeoJSON Type for Algeria Wilaya Boundaries
export interface AlgeriaGeoJSON {
  type: "FeatureCollection";
  name: string;
  crs: CRS;
  features: Feature[];
}

export interface CRS {
  type: "name";
  properties: {
    name: string;
  };
}

export interface Feature {
  type: "Feature";
  properties: WilayaProperties;
  geometry: Geometry;
}

export interface WilayaProperties {
  GID_1: string;
  GID_0: string;
  COUNTRY: string;
  NAME_1: string;
  VARNAME_1: string | null;
  NL_NAME_1: string | null;
  TYPE_1: string;
  ENGTYPE_1: string;
  CC_1: string;
  HASC_1: string;
  ISO_1: string;
}

export interface Geometry {
  type: "MultiPolygon" | "Polygon";
  coordinates: number[][][][]; // [[[ [lon, lat], ... ]]]
}
