import { Injectable, signal } from "@angular/core";
import {
  GeoresourceExportItem,
  Indicator,
  IndicatorExportItem,
  TimeSelectionMode,
} from "./models";

export type ExportType = "single" | "spatialUnit" | "multiple";

export const FORMAT_CONFIG: Record<ExportType, string[]> = {
  single: ["GeoPackage", "Excel", "CSV", "GeoJSON"],
  spatialUnit: ["GeoPackage", "Excel", "CSV"],
  multiple: ["GeoPackage", "Excel", "CSV"],
};

@Injectable({
  providedIn: "root",
})
export class ExportingStateService {
  exportType = signal<ExportType>("single");

  selectedEpsgCode = signal<number | null>(4326);

  spatialUnits = signal<string[]>(["Gesamtstadt", "Stadtteil", "Stadtbezirk"]);

  selectedSpatialUnit = signal<string | null>(null);

  indicatorItems = signal<IndicatorExportItem[]>([]);

  georesourceItems = signal<GeoresourceExportItem[]>([]);

  removeIndicator(indicatorId: string) {
    this.indicatorItems.update((items) =>
      items.filter((item) => item.dataset.id !== indicatorId),
    );
  }

  removeGeoresource(datasetId: string): void {
    this.georesourceItems.update((items) =>
      items.filter((item) => item.dataset.id !== datasetId),
    );
  }

  toggleItemLevel(datasetId: string, level: string): void {
    this.indicatorItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const currentLevels = new Set(item.selectedMultiLevels);
          if (currentLevels.has(level)) currentLevels.delete(level);
          else currentLevels.add(level);
          return { ...item, selectedMultiLevels: [...currentLevels] };
        }
        return item;
      }),
    );
  }

  updateLevel(datasetId: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.indicatorItems.update((items) =>
      items.map((item) =>
        item.dataset.id === datasetId
          ? { ...item, selectedLevel: target.value }
          : item,
      ),
    );
  }

  updateTimeMode(datasetId: string, mode: TimeSelectionMode): void {
    this.indicatorItems.update((items) =>
      items.map((item) =>
        item.dataset.id === datasetId
          ? { ...item, timeSelectionMode: mode }
          : item,
      ),
    );
    this.georesourceItems.update((items) =>
      items.map((item) =>
        item.dataset.id === datasetId
          ? { ...item, timeSelectionMode: mode }
          : item,
      ),
    );
  }

  updateDateRange(
    datasetId: string,
    type: "start" | "end",
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    this.indicatorItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          return {
            ...item,
            dateRange: { ...item.dateRange, [type]: target.value },
          };
        }
        return item;
      }),
    );
    this.georesourceItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          return {
            ...item,
            dateRange: { ...item.dateRange, [type]: target.value },
          };
        }
        return item;
      }),
    );
  }

  toggleMultiSelectOption(datasetId: string, timestamp: string): void {
    this.indicatorItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const currentSelected = new Set(item.selectedTimestamps);
          if (currentSelected.has(timestamp)) currentSelected.delete(timestamp);
          else currentSelected.add(timestamp);
          return { ...item, selectedTimestamps: [...currentSelected] };
        }
        return item;
      }),
    );
    this.georesourceItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const currentSelected = new Set(item.selectedTimestamps);
          if (currentSelected.has(timestamp)) currentSelected.delete(timestamp);
          else currentSelected.add(timestamp);
          return { ...item, selectedTimestamps: [...currentSelected] };
        }
        return item;
      }),
    );
  }

  toggleFormat(datasetId: string, format: string): void {
    this.indicatorItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const formats = new Set(item.selectedFormats);
          if (formats.has(format)) formats.delete(format);
          else formats.add(format);
          return { ...item, selectedFormats: [...formats] };
        }
        return item;
      }),
    );
    this.georesourceItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === datasetId) {
          const formats = new Set(item.selectedFormats);
          if (formats.has(format)) formats.delete(format);
          else formats.add(format);
          return { ...item, selectedFormats: [...formats] };
        }
        return item;
      }),
    );
  }

  addIndicator(indicator: Indicator): void {
    const alreadyExists = this.indicatorItems().some(
      (item) => item.dataset.id === indicator.id,
    );
    if (alreadyExists) return;

    const newItem: IndicatorExportItem = {
      dataset: indicator,
      selectedLevel: undefined,
      timeSelectionMode: "points",
      selectedTimestamps: indicator.availableTimestamps.slice(0, 1),
      dateRange: {
        start:
          indicator.availableTimestamps[
            indicator.availableTimestamps.length - 1
          ] ?? "",
        end: indicator.availableTimestamps[0] ?? "",
      },
      selectedFormats: [],
      selectedMultiLevels: [],
    };

    this.indicatorItems.update((items) => [...items, newItem]);
  }
}
