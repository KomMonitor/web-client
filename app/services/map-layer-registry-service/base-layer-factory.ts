import * as L from 'leaflet';

import { createGrayscaleTileLayer } from 'util/leaflet-grayscale';

import type { BaseLayerRegistration, BaseLayerThumbnail } from './map-layer.model';

/** One entry of `window.__env.baseLayers`. */
export interface BaseLayerConfig {
  /** Display name, also the key of the base layer. */
  name: string;
  url: string;
  /** `TILE_LAYER` | `TILE_LAYER_GRAYSCALE` | `WMS`. */
  layerType: string;
  /** Only for `WMS`; several layers comma-separated. */
  layerName_WMS?: string;
  attribution_html?: string;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  /** Optional preview image for the base map gallery; generated from the start point if omitted. */
  thumbnailUrl?: string;
}

/** Slippy map tile coordinates. */
export interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

/** Creates the Leaflet layer and the automatic preview of one `layerType`. */
export interface BaseLayerFactory {
  create(config: BaseLayerConfig): any;
  thumbnail(config: BaseLayerConfig, tile: TileCoordinates): BaseLayerThumbnail;
}

/** Zoom level of the automatic previews, so all of them show the same area. */
export const THUMBNAIL_ZOOM = 13;
const THUMBNAIL_SIZE = 256;

/** Half the width of the Web Mercator world in metres. */
const MERCATOR_ORIGIN = 20037508.342789244;

/** The tile that contains the given point at zoom `z` (Web Mercator slippy map scheme). */
export function tileAt(lat: number, lng: number, z: number): TileCoordinates {
  const count = 2 ** z;
  const latRad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * count);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * count
  );
  const clamp = (value: number) => Math.min(Math.max(value, 0), count - 1);
  return { x: clamp(x), y: clamp(y), z };
}

/** Bounds of a tile in EPSG:3857 as `[minX, minY, maxX, maxY]`. */
export function tileBoundsMercator(tile: TileCoordinates): [number, number, number, number] {
  const size = (2 * MERCATOR_ORIGIN) / 2 ** tile.z;
  const minX = -MERCATOR_ORIGIN + tile.x * size;
  const maxY = MERCATOR_ORIGIN - tile.y * size;
  return [minX, maxY - size, minX + size, maxY];
}

/** Fills the placeholders of an XYZ URL template; `{s}` takes Leaflet's first default subdomain. */
function tileUrl(template: string, tile: TileCoordinates): string {
  return template
    .replace('{s}', 'a')
    .replace('{z}', String(tile.z))
    .replace('{x}', String(tile.x))
    .replace('{y}', String(tile.y))
    .replace('{r}', '');
}

/** A GetMap request for one tile with the parameters Leaflet sends for the map itself. */
function wmsGetMapUrl(baseUrl: string, layers: string, tile: TileCoordinates): string {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.1.1',
    LAYERS: layers,
    STYLES: '',
    FORMAT: 'image/png',
    TRANSPARENT: 'false',
    SRS: 'EPSG:3857',
    WIDTH: String(THUMBNAIL_SIZE),
    HEIGHT: String(THUMBNAIL_SIZE),
    BBOX: tileBoundsMercator(tile).join(','),
  });
  let separator = '?';
  if (baseUrl.includes('?')) {
    separator = baseUrl.endsWith('?') || baseUrl.endsWith('&') ? '' : '&';
  }
  return baseUrl + separator + params.toString();
}

function tileLayerOptions(config: BaseLayerConfig) {
  return {
    minZoom: config.minZoomLevel,
    maxZoom: config.maxZoomLevel,
    attribution: config.attribution_html,
  };
}

/** One factory per `layerType`; a new base layer type is one entry more. */
export const BASE_LAYER_FACTORIES: Record<string, BaseLayerFactory> = {
  TILE_LAYER: {
    create: (config) => L.tileLayer(config.url, tileLayerOptions(config)),
    thumbnail: (config, tile) => ({ url: tileUrl(config.url, tile), grayscale: false }),
  },
  TILE_LAYER_GRAYSCALE: {
    create: (config) => createGrayscaleTileLayer(config.url, tileLayerOptions(config)),
    thumbnail: (config, tile) => ({ url: tileUrl(config.url, tile), grayscale: true }),
  },
  WMS: {
    create: (config) =>
      L.tileLayer.wms(config.url, {
        ...tileLayerOptions(config),
        layers: config.layerName_WMS,
        format: 'image/png',
      }),
    thumbnail: (config, tile) => ({
      url: wmsGetMapUrl(config.url, config.layerName_WMS ?? '', tile),
      grayscale: false,
    }),
  },
};

/** The Leaflet layer of a base layer entry, or `null` for an unknown `layerType`. */
export function createBaseLayer(config: BaseLayerConfig): any {
  return BASE_LAYER_FACTORIES[config.layerType]?.create(config) ?? null;
}

/** Whether a factory exists for the `layerType` of the entry. */
export function isSupportedBaseLayer(config: BaseLayerConfig): boolean {
  return !!BASE_LAYER_FACTORIES[config.layerType];
}

/**
 * What the map hands to the registry: one registration per configured base
 * layer, id 'base:<name>', with its preview at `center`. Entries with an
 * unknown `layerType` are skipped.
 */
export function createBaseLayerRegistrations(
  configs: BaseLayerConfig[],
  center: { lat: number; lng: number }
): BaseLayerRegistration[] {
  return configs.flatMap((config) => {
    const layer = createBaseLayer(config);
    return layer
      ? [
          {
            id: `base:${config.name}`,
            title: config.name,
            thumbnail: baseLayerThumbnail(config, center),
            layer,
          },
        ]
      : [];
  });
}

/**
 * Preview of a base layer: the configured `thumbnailUrl`, otherwise the tile (or
 * GetMap) at `center`; `null` lets the gallery fall back to an icon.
 */
export function baseLayerThumbnail(
  config: BaseLayerConfig,
  center: { lat: number; lng: number },
  zoom = THUMBNAIL_ZOOM
): BaseLayerThumbnail | null {
  if (config.thumbnailUrl) {
    return { url: config.thumbnailUrl, grayscale: false };
  }
  const factory = BASE_LAYER_FACTORIES[config.layerType];
  if (!factory || !config.url) {
    return null;
  }
  const z = Math.min(Math.max(zoom, config.minZoomLevel ?? zoom), config.maxZoomLevel ?? zoom);
  return factory.thumbnail(config, tileAt(center.lat, center.lng, z));
}
