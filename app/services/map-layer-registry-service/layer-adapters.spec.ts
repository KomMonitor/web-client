import * as L from 'leaflet';

import { createMarkerClusterGroup } from 'util/leaflet-cluster';

import { DEFAULT_LAYER_ADAPTER, resolveLayerAdapter } from './layer-adapters';

const { getBounds } = DEFAULT_LAYER_ADAPTER;

/** South, west, north, east – easier to compare than LatLngBounds objects. */
function box(bounds: L.LatLngBounds | undefined): number[] | undefined {
  return bounds && [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
}

describe('DEFAULT_LAYER_ADAPTER.getBounds', () => {
  it('takes the bounds of a GeoJSON layer', () => {
    const layer = L.geoJSON({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [7.0, 51.0],
            [7.5, 51.0],
            [7.5, 51.5],
            [7.0, 51.0],
          ],
        ],
      },
    } as any);

    expect(box(getBounds(layer))).toEqual([51.0, 7.0, 51.5, 7.5]);
  });

  it('takes the bounds of a feature group', () => {
    const layer = L.featureGroup([L.marker([51.2, 7.1]), L.circleMarker([51.4, 7.3])]);

    expect(box(getBounds(layer))).toEqual([51.2, 7.1, 51.4, 7.3]);
  });

  it('has no bounds for an empty group', () => {
    expect(getBounds(L.featureGroup())).toBeUndefined();
  });

  it('turns the position of a single marker into point bounds', () => {
    expect(box(getBounds(L.marker([51.2, 7.1])))).toEqual([51.2, 7.1, 51.2, 7.1]);
  });

  it('takes the bounds of a marker cluster group', () => {
    const cluster = createMarkerClusterGroup();
    cluster.addLayers([L.marker([51.2, 7.1]), L.marker([51.6, 7.4])]);

    expect(box(getBounds(cluster))).toEqual([51.2, 7.1, 51.6, 7.4]);
  });

  it('has no bounds for a WMS layer unless its bounds option is set', () => {
    const url = 'https://example.org/wms';

    expect(getBounds(L.tileLayer.wms(url, { layers: 'a' }))).toBeUndefined();
    expect(
      box(
        getBounds(
          L.tileLayer.wms(url, {
            layers: 'a',
            bounds: [
              [51.0, 7.0],
              [52.0, 8.0],
            ],
          })
        )
      )
    ).toEqual([51.0, 7.0, 52.0, 8.0]);
  });
});

describe('resolveLayerAdapter', () => {
  it('uses the default without an override', () => {
    expect(resolveLayerAdapter().getBounds).toBe(DEFAULT_LAYER_ADAPTER.getBounds);
  });

  it('lets the override of a registration win', () => {
    const bounds = L.latLngBounds([50, 6], [52, 9]);
    const adapter = resolveLayerAdapter({ getBounds: () => bounds });

    expect(adapter.getBounds(L.tileLayer.wms('https://example.org/wms', { layers: 'a' }))).toBe(
      bounds
    );
  });
});
