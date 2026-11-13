import * as L from 'leaflet';

import {
  baseLayerThumbnail,
  BaseLayerConfig,
  createBaseLayer,
  createBaseLayerRegistrations,
  isSupportedBaseLayer,
  THUMBNAIL_ZOOM,
  tileAt,
  tileBoundsMercator,
} from './base-layer-factory';

const ESSEN = { lat: 51.4386432, lng: 7.0115552 };

const tileConfig: BaseLayerConfig = {
  name: 'OSM Farbe',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}{r}.png',
  layerType: 'TILE_LAYER',
  attribution_html: 'Map data © OSM',
  minZoomLevel: 8,
  maxZoomLevel: 19,
};
const grayscaleConfig: BaseLayerConfig = {
  ...tileConfig,
  name: 'OSM Grau',
  layerType: 'TILE_LAYER_GRAYSCALE',
};
const wmsConfig: BaseLayerConfig = {
  name: 'RVR Stadtplan',
  url: 'https://geodaten.metropoleruhr.de/spw2?',
  layerType: 'WMS',
  layerName_WMS: 'stadtplan_rvr',
  attribution_html: 'Map data © RVR',
  minZoomLevel: 8,
  maxZoomLevel: 19,
};

describe('base-layer-factory', () => {
  describe('tileAt', () => {
    it('finds the tiles of the slippy map scheme', () => {
      expect(tileAt(0, 0, 1)).toEqual({ x: 1, y: 1, z: 1 });
      expect(tileAt(80, -170, 2)).toEqual({ x: 0, y: 0, z: 2 });
      expect(tileAt(ESSEN.lat, ESSEN.lng, 13)).toEqual({ x: 4255, y: 2726, z: 13 });
    });

    it('agrees with Leaflet’s Web Mercator projection', () => {
      const pixel = L.CRS.EPSG3857.latLngToPoint(L.latLng(ESSEN.lat, ESSEN.lng), 15);
      expect(tileAt(ESSEN.lat, ESSEN.lng, 15)).toEqual({
        x: Math.floor(pixel.x / 256),
        y: Math.floor(pixel.y / 256),
        z: 15,
      });
    });

    it('stays on the map beyond the Mercator latitude limit', () => {
      expect(tileAt(89.9, 180, 3)).toEqual({ x: 7, y: 0, z: 3 });
    });
  });

  describe('tileBoundsMercator', () => {
    it('returns the bounds of a tile in EPSG:3857', () => {
      const [minX, minY, maxX, maxY] = tileBoundsMercator({ x: 0, y: 0, z: 1 });
      expect(minX).toBeCloseTo(-20037508.34, 1);
      expect(minY).toBeCloseTo(0, 1);
      expect(maxX).toBeCloseTo(0, 1);
      expect(maxY).toBeCloseTo(20037508.34, 1);
    });

    it('contains the point the tile was taken for', () => {
      const point = L.CRS.EPSG3857.project(L.latLng(ESSEN.lat, ESSEN.lng));
      const [minX, minY, maxX, maxY] = tileBoundsMercator(tileAt(ESSEN.lat, ESSEN.lng, 13));
      expect(point.x).toBeGreaterThanOrEqual(minX);
      expect(point.x).toBeLessThan(maxX);
      expect(point.y).toBeGreaterThan(minY);
      expect(point.y).toBeLessThanOrEqual(maxY);
    });
  });

  describe('baseLayerThumbnail', () => {
    it('fills the placeholders of a tile URL with the tile at the start point', () => {
      expect(baseLayerThumbnail(tileConfig, ESSEN)).toEqual({
        url: 'https://a.tile.openstreetmap.org/13/4255/2726.png',
        grayscale: false,
      });
    });

    it('marks grayscale tile layers for a grayscale filter', () => {
      expect(baseLayerThumbnail(grayscaleConfig, ESSEN)).toEqual({
        url: 'https://a.tile.openstreetmap.org/13/4255/2726.png',
        grayscale: true,
      });
    });

    it('requests a WMS GetMap for the bounds of the start tile', () => {
      const thumbnail = baseLayerThumbnail(wmsConfig, ESSEN)!;
      expect(thumbnail.grayscale).toBe(false);
      expect(thumbnail.url.startsWith('https://geodaten.metropoleruhr.de/spw2?SERVICE=WMS&')).toBe(
        true
      );

      const params = new URL(thumbnail.url).searchParams;
      expect(params.get('REQUEST')).toBe('GetMap');
      expect(params.get('VERSION')).toBe('1.1.1');
      expect(params.get('LAYERS')).toBe('stadtplan_rvr');
      expect(params.get('STYLES')).toBe('');
      expect(params.get('FORMAT')).toBe('image/png');
      expect(params.get('SRS')).toBe('EPSG:3857');
      expect(params.get('WIDTH')).toBe('256');
      expect(params.get('HEIGHT')).toBe('256');
      expect(params.get('BBOX')!.split(',').map(Number)).toEqual(
        tileBoundsMercator({ x: 4255, y: 2726, z: 13 })
      );
    });

    it('appends the GetMap parameters to a WMS URL with its own query', () => {
      const url = baseLayerThumbnail(
        { ...wmsConfig, url: 'https://example.org/wms?map=city' },
        ESSEN
      )!.url;
      expect(url.startsWith('https://example.org/wms?map=city&SERVICE=WMS&')).toBe(true);
      expect(
        baseLayerThumbnail({ ...wmsConfig, url: 'https://example.org/wms' }, ESSEN)!.url
      ).toMatch(/^https:\/\/example\.org\/wms\?SERVICE=WMS&/);
    });

    it('prefers a configured thumbnailUrl and uses it unchanged', () => {
      const thumbnailUrl = 'https://example.org/preview.png';
      expect(baseLayerThumbnail({ ...grayscaleConfig, thumbnailUrl }, ESSEN)).toEqual({
        url: thumbnailUrl,
        grayscale: false,
      });
    });

    it('returns null without a URL or for an unknown layer type, so the gallery shows an icon', () => {
      expect(baseLayerThumbnail({ ...tileConfig, url: '' }, ESSEN)).toBeNull();
      expect(baseLayerThumbnail({ ...tileConfig, layerType: 'WMTS' }, ESSEN)).toBeNull();
    });

    it('keeps the preview zoom within the zoom range of the layer', () => {
      expect(THUMBNAIL_ZOOM).toBe(13);
      const capped = baseLayerThumbnail({ ...tileConfig, maxZoomLevel: 11 }, ESSEN)!;
      expect(capped.url).toContain('/11/');
      const raised = baseLayerThumbnail({ ...tileConfig, minZoomLevel: 14 }, ESSEN)!;
      expect(raised.url).toContain('/14/');
    });
  });

  describe('createBaseLayer', () => {
    it('creates a tile layer with the configured zoom range and attribution', () => {
      const layer = createBaseLayer(tileConfig);
      expect(layer).toBeInstanceOf(L.TileLayer);
      expect(layer._url).toBe(tileConfig.url);
      expect(layer.options.minZoom).toBe(8);
      expect(layer.options.maxZoom).toBe(19);
      expect(layer.options.attribution).toBe('Map data © OSM');
    });

    it('creates the grayscale tile layer for TILE_LAYER_GRAYSCALE', () => {
      const layer = createBaseLayer(grayscaleConfig);
      expect(layer).toBeInstanceOf(L.TileLayer);
      expect(layer.options.crossOrigin).toBe(true);
      expect(createBaseLayer(tileConfig).options.crossOrigin).toBe(false);
    });

    it('creates a WMS layer with its layers and PNG format', () => {
      const layer = createBaseLayer(wmsConfig);
      expect(layer).toBeInstanceOf(L.TileLayer.WMS);
      expect(layer.wmsParams.layers).toBe('stadtplan_rvr');
      expect(layer.wmsParams.format).toBe('image/png');
      expect(layer.options.attribution).toBe('Map data © RVR');
    });

    it('returns null for an unknown layer type', () => {
      const unknown = { ...tileConfig, name: 'Vektor', layerType: 'VECTOR_TILES' };

      expect(createBaseLayer(unknown)).toBeNull();
      expect(isSupportedBaseLayer(unknown)).toBe(false);
      expect(isSupportedBaseLayer(wmsConfig)).toBe(true);
    });
  });

  describe('createBaseLayerRegistrations', () => {
    it('registers each supported base layer under base:<name> with its layer and thumbnail', () => {
      const unknown = { ...tileConfig, name: 'Vektor', layerType: 'VECTOR_TILES' };

      const registrations = createBaseLayerRegistrations(
        [grayscaleConfig, unknown, wmsConfig],
        ESSEN
      );

      expect(registrations.map(({ id, title }) => ({ id, title }))).toEqual([
        { id: 'base:OSM Grau', title: 'OSM Grau' },
        { id: 'base:RVR Stadtplan', title: 'RVR Stadtplan' },
      ]);
      expect(registrations[0].thumbnail).toEqual(baseLayerThumbnail(grayscaleConfig, ESSEN));
      expect(registrations[1].layer).toBeInstanceOf(L.TileLayer.WMS);
    });
  });
});
