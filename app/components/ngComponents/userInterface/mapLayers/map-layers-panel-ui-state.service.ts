import { Injectable, effect, signal } from '@angular/core';

/** localStorage key of the panel's view state. */
export const MAP_LAYERS_PANEL_STORAGE_KEY = 'kommonitor.mapLayers.panel';

interface StoredUiState {
  collapsedGroups?: string[];
  baseLayersExpanded?: boolean;
}

/**
 * Pure view state of the layer panel, kept apart from the layer registry:
 * which groups are collapsed and whether the base layer gallery is open. Stored in localStorage, so it survives a reload
 * and the sidebar destroying the panel. Without storage (private mode, blocked
 * site data) it still works, it just forgets.
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

  toggleBaseLayers(): void {
    this._baseLayersExpanded.update((expanded) => !expanded);
  }

  toggle(groupId: string): void {
    this.collapsedGroups.update((collapsed) => {
      const next = new Set(collapsed);
      if (!next.delete(groupId)) {
        next.add(groupId);
      }
      return next;
    });
  }
}

function readStoredState(): StoredUiState {
  try {
    const raw = localStorage.getItem(MAP_LAYERS_PANEL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUiState) : {};
  } catch {
    return {};
  }
}
