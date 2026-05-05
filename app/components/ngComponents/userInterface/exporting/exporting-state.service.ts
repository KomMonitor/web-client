import { Injectable, effect, signal } from "@angular/core";
import {
  GeoresourceExportItem,
  Indicator,
  IndicatorExportItem,
  TimeSelectionMode,
} from "./models";

const LS_INDICATOR_ITEMS = "kommonitor.export.indicatorItems";
const LS_GEORESOURCE_ITEMS = "kommonitor.export.georesourceItems";

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export type ExportType = "single" | "spatialUnit" | "multiple";

@Injectable({
  providedIn: "root",
})
export class ExportingStateService {
  exportType = signal<ExportType>("single");

  selectedEpsgCode = signal<number | null>(4326);

  spatialUnits = signal<string[]>(["Gesamtstadt", "Stadtteil", "Stadtbezirk"]);

  selectedSpatialUnit = signal<string | null>(null);

  indicatorItems = signal<IndicatorExportItem[]>(
    loadFromStorage<IndicatorExportItem>(LS_INDICATOR_ITEMS),
  );

  georesourceItems = signal<GeoresourceExportItem[]>(
    loadFromStorage<GeoresourceExportItem>(LS_GEORESOURCE_ITEMS),
  );

  constructor() {
    effect(() => {
      localStorage.setItem(
        LS_INDICATOR_ITEMS,
        JSON.stringify(this.indicatorItems()),
      );
    });
    effect(() => {
      localStorage.setItem(
        LS_GEORESOURCE_ITEMS,
        JSON.stringify(this.georesourceItems()),
      );
    });
  }
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

  toggleSpatialUnit(indicator: IndicatorExportItem, spatialUnitId: string): void {
    this.indicatorItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === indicator.dataset.id) {
          const currentLevels = new Set(item.selectedSpatialUnits);
          if (currentLevels.has(spatialUnitId)) currentLevels.delete(spatialUnitId);
          else currentLevels.add(spatialUnitId);
          return { ...item, selectedSpatialUnits: [...currentLevels] };
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
      selectedFormats: [],
      selectedSpatialUnits: [],
    };

    this.indicatorItems.update((items) => [...items, newItem]);
  }
}
