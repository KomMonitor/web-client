export type TimeSelectionMode = 'points' | 'range';

export type SelectedTargetTime =
  | { mode: 'point'; value: string }
  | { mode: 'range'; start: string; end: string };

export const AVAILABLE_FORMATS = ['GeoPackage', 'Excel', 'CSV', 'GeoJSON'] as const;

export type ExportFormat = (typeof AVAILABLE_FORMATS)[number];

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

export interface BaseExportItem {
  selectedFormats: ExportFormat[];
  selectedTargetTime?: SelectedTargetTime;
}

export interface IndicatorExportItem extends BaseExportItem {
  dataset: Indicator;
  selectedSpatialUnitIds: string[];
}

export interface GeoressourceExportItem extends BaseExportItem {
  dataset: Georessource;
}

// TODO kann das wech?
export type ExportItem = IndicatorExportItem | GeoressourceExportItem;

export const sortTimestamps = (
  timestamps: string[],
  direction: 'asc' | 'desc' = 'desc'
): string[] => {
  return [...timestamps].sort((a, b) =>
    direction === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
  );
};
