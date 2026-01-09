import { Injectable, signal } from "@angular/core";
import {
  ExportItem,
  TimeSelectionMode,
} from "../../components/ngComponents/userInterface/exporting/models";

export type SelectionType = "none" | "multiIndicator" | "multiSpatialUnit";

@Injectable({
  providedIn: "root",
})
export class ExportingService {
  selectionType = signal<SelectionType>("multiSpatialUnit");

  // TODO: fetch available spatial units
  spatialUnits = signal<string[]>(["Gesamtstadt", "Stadtteil", "Stadtbezirk"]);

  selectedSpatialUnit = signal<string | null>(null);

  // TODO: fetch export items
  exportItems = signal<ExportItem[]>([
    {
      dataset: {
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
      selectedLevel: "Stadtteile",
      selectedTimestamps: ["2023-12-31", "2022-12-31"],
      dateRange: { start: "2022-01-01", end: "2023-12-31" },
      selectedFormats: ["Excel", "CSV"],
      selectedMultiLevels: ["Stadtteile", "Statistische Bezirke"],
      timeSelectionMode: "points",
    },
    {
      dataset: {
        id: "geo-1",
        name: "Schulstandorte",
        type: "georesource",
        availableTimestamps: ["2024-01-01", "2023-01-01", "2022-01-01"],
      },
      timeSelectionMode: "range",
      selectedTimestamps: [],
      dateRange: { start: "2022-01-01", end: "2024-01-01" },
      selectedFormats: ["GeoPackage", "GeoJSON"],
      selectedMultiLevels: [],
    },
    // {
    //   dataset: {
    //     id: "ind-2",
    //     name: "Arbeitslosenquote",
    //     type: "indicator",
    //     availableLevels: ["Gesamtstadt", "Stadtteile"],
    //     availableTimestamps: [
    //       "2024-03-31",
    //       "2023-12-31",
    //       "2023-09-30",
    //       "2023-06-30",
    //     ],
    //   },
    //   selectedLevel: "Gesamtstadt",
    //   timeSelectionMode: "points",
    //   selectedTimestamps: ["2024-03-31", "2023-12-31"],
    //   dateRange: { start: "2023-06-30", end: "2024-03-31" },
    //   selectedFormats: ["Excel"],
    //   selectedMultiLevels: ["Gesamtstadt"],
    // },
    // {
    //   dataset: {
    //     id: "ind-3",
    //     name: "Durchschnittsalter",
    //     type: "indicator",
    //     availableLevels: ["Gesamtstadt", "Stadtteile", "Statistische Bezirke"],
    //     availableTimestamps: ["2023-12-31", "2022-12-31"],
    //   },
    //   selectedLevel: "Statistische Bezirke",
    //   timeSelectionMode: "range",
    //   selectedTimestamps: [],
    //   dateRange: { start: "2022-12-31", end: "2023-12-31" },
    //   selectedFormats: ["CSV"],
    //   selectedMultiLevels: ["Gesamtstadt", "Stadtteile"],
    // }
  ]);

  removeDataset(datasetId: string): void {
    this.exportItems.update((items) =>
      items.filter((item) => item.dataset.id !== datasetId)
    );
  }

  toggleItemLevel(datasetId: string, level: string): void {
    this.exportItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const currentLevels = new Set(item.selectedMultiLevels);
          if (currentLevels.has(level)) currentLevels.delete(level);
          else currentLevels.add(level);
          return { ...item, selectedMultiLevels: [...currentLevels] };
        }
        return item;
      })
    );
  }

  updateLevel(datasetId: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.exportItems.update((items) =>
      items.map((item) =>
        item.dataset.id === datasetId
          ? { ...item, selectedLevel: target.value }
          : item
      )
    );
  }

  updateTimeMode(datasetId: string, mode: TimeSelectionMode): void {
    this.exportItems.update((items) =>
      items.map((item) =>
        item.dataset.id === datasetId
          ? { ...item, timeSelectionMode: mode }
          : item
      )
    );
  }

  updateDateRange(
    datasetId: string,
    type: "start" | "end",
    event: Event
  ): void {
    const target = event.target as HTMLInputElement;
    this.exportItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          return {
            ...item,
            dateRange: { ...item.dateRange, [type]: target.value },
          };
        }
        return item;
      })
    );
  }

  toggleMultiSelectOption(datasetId: string, timestamp: string): void {
    this.exportItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const currentSelected = new Set(item.selectedTimestamps);
          if (currentSelected.has(timestamp)) currentSelected.delete(timestamp);
          else currentSelected.add(timestamp);
          return { ...item, selectedTimestamps: [...currentSelected] };
        }
        return item;
      })
    );
  }

  toggleFormat(datasetId: string, format: string): void {
    this.exportItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const formats = new Set(item.selectedFormats);
          if (formats.has(format)) formats.delete(format);
          else formats.add(format);
          return { ...item, selectedFormats: [...formats] };
        }
        return item;
      })
    );
  }
}
