import { Injectable, computed, effect, signal } from "@angular/core";
import {
  Georessource,
  GeoressourceExportItem,
  Indicator,
  IndicatorExportItem,
  SpatialUnit,
} from "./models";

const LS_INDICATOR_ITEMS = "kommonitor.export.indicatorItems";
const LS_GEORESSOURCE_ITEMS = "kommonitor.export.georessourceItems";

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

  georessourceItems = signal<GeoressourceExportItem[]>(
    loadFromStorage<GeoressourceExportItem>(LS_GEORESSOURCE_ITEMS),
  );

  commonSpatialUnits = computed<SpatialUnit[]>(() => {
    const items = this.indicatorItems();
    if (items.length === 0) return [];
    const firstUnits = items[0].dataset.spatialUnits;
    return firstUnits.filter((unit) =>
      items.every((item) =>
        item.dataset.spatialUnits.some((u) => u.id === unit.id),
      ),
    );
  });

  constructor() {
    effect(() => {
      localStorage.setItem(
        LS_INDICATOR_ITEMS,
        JSON.stringify(this.indicatorItems()),
      );
    });
    effect(() => {
      localStorage.setItem(
        LS_GEORESSOURCE_ITEMS,
        JSON.stringify(this.georessourceItems()),
      );
    });
  }
  removeIndicator(indicatorId: string) {
    this.indicatorItems.update((items) =>
      items.filter((item) => item.dataset.id !== indicatorId),
    );
  }

  removeGeoressource(datasetId: string): void {
    this.georessourceItems.update((items) =>
      items.filter((item) => item.dataset.id !== datasetId),
    );
  }

  toggleSpatialUnit(
    indicator: IndicatorExportItem,
    spatialUnitId: string,
  ): void {
    this.indicatorItems.update((items) =>
      items.map((item) => {
        if (item.dataset.id === indicator.dataset.id) {
          const currentLevels = new Set(item.selectedSpatialUnits);
          if (currentLevels.has(spatialUnitId))
            currentLevels.delete(spatialUnitId);
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
    this.georessourceItems.update((items) =>
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

  addGeoressource(georessource: Georessource) {
    const alreadyExists = this.indicatorItems().some(
      (item) => item.dataset.id === georessource.id,
    );
    if (alreadyExists) return;

    const newItem: GeoressourceExportItem = {
      dataset: georessource,
      selectedFormats: [],
    };

    this.georessourceItems.update((items) => [...items, newItem]);
  }
}
