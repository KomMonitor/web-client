export type TimeSelectionMode = "points" | "range";

export type SelectedTargetTime = string | { start: string; end: string };

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

export interface Georessource {
  id: string;
  name: string;
  availableTimestamps: string[];
}

export interface IndicatorExportItem {
  dataset: Indicator;
  selectedFormats: string[];
  selectedSpatialUnits: string[];
  selectedTargetTime?: SelectedTargetTime;
}

export interface GeoressourceExportItem {
  dataset: Georessource;
  selectedFormats: string[];
  selectedTargetTime?: SelectedTargetTime;
}

export type ExportItem = IndicatorExportItem | GeoressourceExportItem;

export const AVAILABLE_FORMATS = ["GeoPackage", "Excel", "CSV", "GeoJSON"];

export const sortTimestamps = (timestamps: string[]): string[] => {
  return [...timestamps].sort((a, b) => b.localeCompare(a));
};

export const sortTimestampsAsc = (timestamps: string[]): string[] => {
  return [...timestamps].sort((a, b) => a.localeCompare(b));
};
