export type DatasetType = "indicator" | "georesource";
export type TimeSelectionMode = "points" | "range";

export interface Dataset {
  id: string;
  name: string;
  type: DatasetType;
  availableTimestamps: string[];
}

export interface Indicator extends Dataset {
  type: "indicator";
  availableLevels: string[];
}

export interface ExportItem {
  dataset: Dataset | Indicator;
  selectedLevel?: string;
  timeSelectionMode: TimeSelectionMode;
  selectedTimestamps: string[];
  dateRange: { start: string; end: string };
  selectedFormats: string[];
  selectedMultiLevels: string[];
}

// --- MOCK DATA ---
const MOCK_DATASETS: (Dataset | Indicator)[] = [
  {
    id: "ind-1",
    name: "Bevölkerungsdichte",
    type: "indicator",
    availableLevels: ["Gesamtstadt", "Stadtteile", "Statistische Bezirke"],
    availableTimestamps: [
      "2023-12-31",
      "2022-12-31",
      "2021-12-31",
      "2020-12-31",
      "2019-12-31",
    ],
  },
  {
    id: "ind-2",
    name: "Arbeitslosenquote",
    type: "indicator",
    availableLevels: ["Gesamtstadt", "Stadtteile"],
    availableTimestamps: [
      "2024-03-31",
      "2023-12-31",
      "2023-09-30",
      "2023-06-30",
    ],
  },
  {
    id: "geo-1",
    name: "Schulstandorte",
    type: "georesource",
    availableTimestamps: ["2024-01-01", "2023-01-01", "2022-01-01"],
  },
  {
    id: "ind-3",
    name: "Durchschnittsalter",
    type: "indicator",
    availableLevels: ["Gesamtstadt", "Stadtteile", "Statistische Bezirke"],
    availableTimestamps: ["2023-12-31", "2022-12-31"],
  },
];

export const AVAILABLE_FORMATS = ["GeoPackage", "Excel", "CSV", "GeoJSON"];

export const sortTimestamps = (timestamps: string[]): string[] => {
  return [...timestamps].sort((a, b) => b.localeCompare(a));
};

export const sortTimestampsAsc = (timestamps: string[]): string[] => {
  return [...timestamps].sort((a, b) => a.localeCompare(b));
};
