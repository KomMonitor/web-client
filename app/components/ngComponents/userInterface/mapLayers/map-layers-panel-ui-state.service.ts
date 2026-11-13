import { Injectable, effect, signal } from '@angular/core';

/** localStorage key of the panel's view state. */
export const MAP_LAYERS_PANEL_STORAGE_KEY = 'kommonitor.mapLayers.panel';

interface StoredUiState {
  collapsedGroups?: string[];
}

/**
 * Pure view state of the layer panel, kept apart from the layer registry:
 * which groups are collapsed. Stored in localStorage, so it survives a reload
 * and the sidebar destroying the panel. Without storage (private mode, blocked
 * site data) it still works, it just forgets.
 */
@Injectable({
  providedIn: 'root',
})
export class MapLayersPanelUiState {
  private readonly collapsedGroups = signal<ReadonlySet<string>>(
    new Set(readStoredState().collapsedGroups ?? [])
  );

  constructor() {
    effect(() => {
      const state: StoredUiState = { collapsedGroups: [...this.collapsedGroups()] };
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
