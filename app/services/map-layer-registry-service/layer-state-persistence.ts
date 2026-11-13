import type { BaseLayerSelection } from './map-layer.model';

/** localStorage key of the remembered layer preferences of the main map. */
export const MAP_LAYERS_PREFERENCES_STORAGE_KEY = 'kommonitor.mapLayers.preferences';

const PREFERENCES_VERSION = 1;

/**
 * What the layer panel remembers across reloads: the base layer and its
 * opacity (E2), later the order of the groups (F1). Visibility, opacity and
 * order of the thematic layers are not remembered on purpose.
 */
export interface LayerPreferences {
  baseLayer?: BaseLayerSelection;
}

/** Port for remembering the preferences: localStorage today, a URL or a server later. */
export interface LayerStatePersistence {
  /** The remembered preferences; empty if there are none or they cannot be read. */
  load(): LayerPreferences;
  save(preferences: LayerPreferences): void;
}

/**
 * Keeps the preferences in localStorage, versioned. Without storage (private
 * mode, blocked site data) nothing is remembered and nothing breaks.
 */
export class LocalStorageLayerStatePersistence implements LayerStatePersistence {
  constructor(private readonly key = MAP_LAYERS_PREFERENCES_STORAGE_KEY) {}

  load(): LayerPreferences {
    try {
      const stored = JSON.parse(localStorage.getItem(this.key) ?? 'null');
      if (stored?.version !== PREFERENCES_VERSION) {
        return {};
      }
      return isBaseLayerSelection(stored.baseLayer) ? { baseLayer: stored.baseLayer } : {};
    } catch {
      return {};
    }
  }

  save(preferences: LayerPreferences): void {
    try {
      localStorage.setItem(
        this.key,
        JSON.stringify({ version: PREFERENCES_VERSION, ...preferences })
      );
    } catch {
      // no storage: the preferences live for this session only
    }
  }
}

function isBaseLayerSelection(value: any): value is BaseLayerSelection {
  return (
    !!value &&
    (value.id === null || typeof value.id === 'string') &&
    typeof value.opacity === 'number' &&
    value.opacity >= 0 &&
    value.opacity <= 1
  );
}
