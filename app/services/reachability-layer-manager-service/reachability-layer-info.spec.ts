import { reachabilityLayerInfo } from './reachability-layer-info';

describe('reachabilityLayerInfo', () => {
  it('names mode, measure, thresholds in metres and the start points', () => {
    const info = reachabilityLayerInfo(
      { transitMode: 'cycling-regular', focus: 'distance', rangeArray: [500, 1000], unit: 'Meter' },
      'Schulen',
      12
    );

    expect(info.items).toEqual([
      {
        labelKey: 'MAP_LAYERS.INFO.TRANSIT_MODE',
        valueKey: 'MAP_LAYERS.INFO.TRANSIT_MODES.CYCLING_REGULAR',
      },
      { labelKey: 'MAP_LAYERS.INFO.FOCUS', valueKey: 'MAP_LAYERS.INFO.FOCUS_VALUES.DISTANCE' },
      {
        labelKey: 'MAP_LAYERS.INFO.RANGES',
        valueKey: 'MAP_LAYERS.INFO.RANGES_DISTANCE',
        params: { values: '500, 1000' },
      },
      {
        labelKey: 'MAP_LAYERS.INFO.START_POINTS',
        valueKey: 'MAP_LAYERS.INFO.START_POINTS_VALUE',
        params: { name: 'Schulen', count: 12 },
      },
    ]);
  });

  it('gives minutes for time, even if the settings still say metres', () => {
    const info = reachabilityLayerInfo(
      { transitMode: 'driving-car', focus: 'time', rangeArray: [5, 10], unit: 'Meter' },
      'Manuelle Eingabe',
      1
    );

    expect(info.items[1].valueKey).toBe('MAP_LAYERS.INFO.FOCUS_VALUES.TIME');
    expect(info.items[2]).toMatchObject({
      valueKey: 'MAP_LAYERS.INFO.RANGES_TIME',
      params: { values: '5, 10' },
    });
  });

  it('keeps the values of the moment, not later changes of the settings', () => {
    const settings = { transitMode: 'foot-walking', focus: 'distance', rangeArray: [500] };
    const info = reachabilityLayerInfo(settings, 'Schulen', 1);

    settings.rangeArray.push(1000);
    settings.focus = 'time';

    expect(info.items[2].params).toEqual({ values: '500' });
    expect(info.items[1].valueKey).toBe('MAP_LAYERS.INFO.FOCUS_VALUES.DISTANCE');
  });

  it('shows an unknown mode as it is and leaves out missing thresholds', () => {
    const info = reachabilityLayerInfo({ transitMode: 'hovercraft' }, 'Schulen', 1);

    expect(info.items[0]).toEqual({
      labelKey: 'MAP_LAYERS.INFO.TRANSIT_MODE',
      value: 'hovercraft',
    });
    expect(info.items[2]).toEqual({ labelKey: 'MAP_LAYERS.INFO.RANGES' });
  });
});
