import { createMarkerClusterGroup } from './leaflet-cluster';

describe('createMarkerClusterGroup', () => {
  it('keeps the plugin defaults without a pane', () => {
    const { options } = createMarkerClusterGroup({ maxClusterRadius: 40 });

    expect(options.maxClusterRadius).toBe(40);
    expect(options.clusterPane).toBe('markerPane');
    expect(options.spiderLegPolylineOptions).toEqual({ weight: 1.5, color: '#222', opacity: 0.5 });
  });

  it('puts cluster icons and spider legs into the given pane', () => {
    const { options } = createMarkerClusterGroup({ maxClusterRadius: 40 }, 'mapLayer1');

    expect(options.maxClusterRadius).toBe(40);
    expect(options.clusterPane).toBe('mapLayer1');
    expect(options.spiderLegPolylineOptions).toEqual({
      weight: 1.5,
      color: '#222',
      opacity: 0.5,
      pane: 'mapLayer1',
    });
  });

  it('keeps own spider leg options next to the pane', () => {
    const { options } = createMarkerClusterGroup(
      { spiderLegPolylineOptions: { color: 'red' } },
      'mapLayer1'
    );

    expect(options.spiderLegPolylineOptions).toEqual({
      weight: 1.5,
      color: 'red',
      opacity: 0.5,
      pane: 'mapLayer1',
    });
  });
});
