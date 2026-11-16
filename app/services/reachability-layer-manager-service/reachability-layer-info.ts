import type { LayerInfo } from 'services/map-layer-registry-service/map-layer.model';

/** Translation keys of the transport modes Open Route Service is asked for. */
const TRANSIT_MODE_KEYS: Record<string, string> = {
  buffer: 'MAP_LAYERS.INFO.TRANSIT_MODES.BUFFER',
  'foot-walking': 'MAP_LAYERS.INFO.TRANSIT_MODES.FOOT_WALKING',
  'cycling-regular': 'MAP_LAYERS.INFO.TRANSIT_MODES.CYCLING_REGULAR',
  'driving-car': 'MAP_LAYERS.INFO.TRANSIT_MODES.DRIVING_CAR',
  wheelchair: 'MAP_LAYERS.INFO.TRANSIT_MODES.WHEELCHAIR',
};

/**
 * The details of a reachability layer, scenario or live, as its settings were
 * when it was registered: the live settings change with the next input, so
 * everything is copied now. Thresholds are minutes for 'time' and metres for
 * 'distance', whatever the settings' own `unit` says.
 */
export function reachabilityLayerInfo(
  settings: any,
  startName: string,
  startCount: number
): LayerInfo {
  const time = settings?.focus === 'time';
  const ranges = [...(settings?.rangeArray ?? [])].join(', ');
  const transitMode = settings?.transitMode;
  const transitModeKey = TRANSIT_MODE_KEYS[transitMode];
  return {
    items: [
      transitModeKey
        ? { labelKey: 'MAP_LAYERS.INFO.TRANSIT_MODE', valueKey: transitModeKey }
        : { labelKey: 'MAP_LAYERS.INFO.TRANSIT_MODE', value: transitMode },
      {
        labelKey: 'MAP_LAYERS.INFO.FOCUS',
        valueKey: time
          ? 'MAP_LAYERS.INFO.FOCUS_VALUES.TIME'
          : 'MAP_LAYERS.INFO.FOCUS_VALUES.DISTANCE',
      },
      ranges
        ? {
            labelKey: 'MAP_LAYERS.INFO.RANGES',
            valueKey: time ? 'MAP_LAYERS.INFO.RANGES_TIME' : 'MAP_LAYERS.INFO.RANGES_DISTANCE',
            params: { values: ranges },
          }
        : { labelKey: 'MAP_LAYERS.INFO.RANGES' },
      {
        labelKey: 'MAP_LAYERS.INFO.START_POINTS',
        valueKey: 'MAP_LAYERS.INFO.START_POINTS_VALUE',
        params: { name: startName, count: startCount },
      },
    ],
  };
}
