export type TimeSelectionMode = "points" | "range";

export interface SpatialUnit {
  id: string;
  name: string;
}

export interface Indicator {
  id: string;
  name: string;
  spatialUnits: SpatialUnit[];
  availableTimestamps: string[];
}

export interface Georesource {
  id: string;
  name: string;
  availableTimestamps: string[];
}

export interface IndicatorExportItem {
  dataset: Indicator;
  selectedLevel?: string;
  timeSelectionMode: TimeSelectionMode;
  selectedTimestamps: string[];
  dateRange: { start: string; end: string };
  selectedFormats: string[];
  selectedMultiLevels: string[];
}

export interface GeoresourceExportItem {
  dataset: Georesource;
  timeSelectionMode: TimeSelectionMode;
  selectedTimestamps: string[];
  dateRange: { start: string; end: string };
  selectedFormats: string[];
}

export type ExportItem = IndicatorExportItem | GeoresourceExportItem;

export const AVAILABLE_FORMATS = ["GeoPackage", "Excel", "CSV", "GeoJSON"];

export const sortTimestamps = (timestamps: string[]): string[] => {
  return [...timestamps].sort((a, b) => b.localeCompare(a));
};

export const sortTimestampsAsc = (timestamps: string[]): string[] => {
  return [...timestamps].sort((a, b) => a.localeCompare(b));
};
