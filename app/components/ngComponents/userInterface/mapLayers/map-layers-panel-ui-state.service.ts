import { Injectable, effect, signal } from '@angular/core';

/** localStorage key of the panel's view state. */
export const MAP_LAYERS_PANEL_STORAGE_KEY = 'kommonitor.mapLayers.panel';

interface StoredUiState {
  collapsedGroups?: string[];
  baseLayersExpanded?: boolean;
}

/**
 * Pure view state of the layer panel, kept apart from the layer registry:
 * which groups are collapsed, whether the base layer gallery is open and which
 * rows show their transparency and whose details are open. Groups and gallery
 * are stored in localStorage, so they survive a reload and the sidebar
 * destroying the panel; without storage (private mode, blocked site data) they
 * still work, they just forget. Open rows and details are only kept in memory,
 * like the state of the layers themselves.
 */
@Injectable({
  providedIn: 'root',
})
export class MapLayersPanelUiState {
  private readonly stored = readStoredState();
  private readonly collapsedGroups = signal<ReadonlySet<string>>(
    new Set(this.stored.collapsedGroups ?? [])
  );
  private readonly _baseLayersExpanded = signal(this.stored.baseLayersExpanded ?? false);

  private readonly expandedRows = signal<ReadonlySet<string>>(new Set());
  /** The layer whose details are open; one at a time. */
  private readonly infoLayerId = signal<string | null>(null);

  /** The base layer gallery starts collapsed. */
  readonly baseLayersExpanded = this._baseLayersExpanded.asReadonly();

  constructor() {
    effect(() => {
      const state: StoredUiState = {
        collapsedGroups: [...this.collapsedGroups()],
        baseLayersExpanded: this._baseLayersExpanded(),
      };
      try {
        localStorage.setItem(MAP_LAYERS_PANEL_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // no storage: the state lives for this session only
      }
    });
  }

  /** Groups start expanded. */
  isExpanded(groupId: string): boolean {
    return !this.collapsedGroups().has(groupId);
  }

  /** Rows start collapsed. */
  isRowExpanded(layerId: string): boolean {
    return this.expandedRows().has(layerId);
  }

  toggleRow(layerId: string): void {
    this.expandedRows.update((expanded) => toggled(expanded, layerId));
  }

  isInfoOpen(layerId: string): boolean {
    return this.infoLayerId() === layerId;
  }

  /** Opens the details of a layer and closes those of any other. */
  showInfo(layerId: string): void {
    this.infoLayerId.set(layerId);
  }

  closeInfo(): void {
    this.infoLayerId.set(null);
  }

  toggleBaseLayers(): void {
    this._baseLayersExpanded.update((expanded) => !expanded);
  }

  toggle(groupId: string): void {
    this.collapsedGroups.update((collapsed) => toggled(collapsed, groupId));
  }
}

/** A copy of `set` with `value` added, or removed if it was there. */
function toggled(set: ReadonlySet<string>, value: string): ReadonlySet<string> {
  const next = new Set(set);
  if (!next.delete(value)) {
    next.add(value);
  }
  return next;
}

function readStoredState(): StoredUiState {
  try {
    const raw = localStorage.getItem(MAP_LAYERS_PANEL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUiState) : {};
  } catch {
    return {};
  }
}
