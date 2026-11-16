import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';

import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MapContext } from 'services/map-service/map-context';

import { GeoresourceLayerManagerService } from './georesource-layer-manager.service';

const point = (lon: number, lat: number, name: string) => ({
  type: 'Feature',
  properties: { name },
  geometry: { type: 'Point', coordinates: [lon, lat] },
});

const polygon = (offset = 0) => ({
  type: 'Feature',
  properties: { name: 'Fläche' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [7.0 + offset, 51.0],
        [7.5 + offset, 51.0],
        [7.5 + offset, 51.5],
        [7.0 + offset, 51.0],
      ],
    ],
  },
});

function poiDataset(id = 'g-1', datasetName = 'Schulen') {
  return {
    georesourceId: id,
    datasetName,
    poiMarkerStyle: 'symbol',
    poiSymbolColor: 'white',
    poiMarkerColor: 'blue',
    poiSymbolBootstrap3Name: 'home',
    geoJSON: {
      type: 'FeatureCollection',
      features: [point(7.0, 51.0, 'A'), point(7.1, 51.1, 'B'), point(7.2, 51.2, 'C')],
    },
  };
}

describe('GeoresourceLayerManagerService', () => {
  let service: GeoresourceLayerManagerService;
  let layers: MapLayerRegistry;
  let context: MapContext;
  let register: jest.SpyInstance;

  /** The Leaflet layer handed to the registry by the last registration. */
  const lastLayer = (): any => register.mock.calls.at(-1)[0].layer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GeoresourceLayerManagerService);
    layers = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    register = jest.spyOn(layers, 'register');
    context = {
      map: { invalidateSize: jest.fn() },
      layerControl: { addOverlay: jest.fn(), removeLayer: jest.fn(), _layers: [] },
      layers,
      hideLoadingIcon: jest.fn(),
    };
    service.initialize(context);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('POI', () => {
    it('registers clustered markers as one searchable point entry dated by its subtitle', () => {
      service.addPoiGeoresource(poiDataset(), '2024-01-01', true);

      expect(layers.entry('georesource:g-1')).toMatchObject({
        groupId: 'georesource.point',
        title: 'Schulen',
        subtitle: '2024-01-01',
        kind: 'cluster',
        symbol: { kind: 'point', color: 'blue' },
        capabilities: expect.objectContaining({ searchable: true }),
      });
      expect(context.layerControl.addOverlay).not.toHaveBeenCalled();
      expect(context.hideLoadingIcon).toHaveBeenCalled();
    });

    it('puts markers and cluster icons into the pane of the entry', () => {
      service.addPoiGeoresource(poiDataset(), '2024-01-01', true);

      const cluster = lastLayer();
      const pane = layers.paneFor('georesource:g-1');
      expect(cluster.options.clusterPane).toBe(pane);
      expect(cluster.getLayers().map((marker: any) => marker.options.pane)).toEqual([
        pane,
        pane,
        pane,
      ]);
    });

    it('adds each marker once instead of the cluster group to itself', () => {
      // the old code called cluster.addLayer(cluster) per marker, which markercluster
      // turns into addLayers([cluster]) and so re-checked every marker again
      const addLayers = jest.spyOn((window as any).L.MarkerClusterGroup.prototype, 'addLayers');

      service.addPoiGeoresource(poiDataset(), '2024-01-01', true);

      const cluster = lastLayer();
      expect(cluster.getLayers()).toHaveLength(3);
      expect(addLayers.mock.calls.filter(([added]: any[]) => added.includes(cluster))).toEqual([]);
    });

    it('uses a plain feature group of markers without clustering', () => {
      service.addPoiGeoresource(poiDataset(), '2024-01-01', false);

      expect(layers.entry('georesource:g-1')?.kind).toBe('marker');
      expect(lastLayer()).toBeInstanceOf(L.FeatureGroup);
      expect(lastLayer().getLayers()).toHaveLength(3);
    });
  });

  it('registers areas with their color and paths in the pane of the entry', () => {
    service.addAoiGeoresource(
      { georesourceId: 'g-2', datasetName: 'Parks', aoiColor: 'green', geoJSON: polygon() },
      '2024-01-01'
    );

    expect(layers.entry('georesource:g-2')).toMatchObject({
      groupId: 'georesource.area',
      kind: 'vector',
      symbol: { kind: 'fill', color: 'green' },
    });
    const [path] = lastLayer().getLayers();
    expect(path.options).toMatchObject({
      pane: layers.paneFor('georesource:g-2'),
      fillColor: 'green',
    });
  });

  it('registers lines and draws polygons as their outlines', () => {
    service.addLoiGeoresource(
      {
        georesourceId: 'g-3',
        datasetName: 'Radwege',
        loiColor: 'red',
        loiWidth: 4,
        geoJSON: { type: 'FeatureCollection', features: [polygon()] },
      },
      '2024-01-01'
    );

    expect(layers.entry('georesource:g-3')).toMatchObject({
      groupId: 'georesource.line',
      kind: 'vector',
      symbol: { kind: 'line', color: 'red' },
    });
    const paths = lastLayer()
      .getLayers()
      .flatMap((geoJson: any) => geoJson.getLayers());
    expect(
      paths.every((path: any) => path instanceof L.Polyline && !(path instanceof L.Polygon))
    ).toBe(true);
    expect(paths.map((path: any) => path.options.pane)).toEqual([
      layers.paneFor('georesource:g-3'),
    ]);
  });

  it('replaces the layer on another date or clustering and keeps visibility, opacity and position', () => {
    service.addPoiGeoresource(poiDataset('g-1'), '2024-01-01', true);
    service.addPoiGeoresource(poiDataset('g-9', 'Kitas'), '2024-01-01', true);
    layers.setVisible('georesource:g-1', false);
    layers.setOpacity('georesource:g-1', 0.4);

    service.addPoiGeoresource(poiDataset('g-1'), '2025-01-01', false);

    expect(layers.entry('georesource:g-1')).toMatchObject({
      subtitle: '2025-01-01',
      kind: 'marker',
      visible: false,
      opacity: 0.4,
    });
    expect(layers.drawOrder()).toEqual(['georesource:g-9', 'georesource:g-1']);
  });

  it('is removable in the layer panel only with an owner from its catalogue', () => {
    const owner = { remove: jest.fn() };
    const area = { georesourceId: 'g-2', datasetName: 'Parks', aoiColor: 'green' };
    service.addPoiGeoresource(poiDataset(), '2024-01-01', true, owner);
    service.addAoiGeoresource({ ...area, geoJSON: polygon() }, '2024-01-01');

    expect(layers.entry('georesource:g-1')!.capabilities).toMatchObject({
      remove: true,
      searchable: true,
    });
    expect(layers.entry('georesource:g-2')!.capabilities.remove).toBe(false);

    layers.remove('georesource:g-1');
    expect(owner.remove).toHaveBeenCalledWith('georesource:g-1');
  });

  it('removes only its own entry, not one whose name starts the same', () => {
    service.addPoiGeoresource(poiDataset('g-1', 'Schulen'), '2024-01-01', true);
    service.addPoiGeoresource(poiDataset('g-2', 'Schulen_alt'), '2024-01-01', true);

    service.removePoiGeoresource({ georesourceId: 'g-1', datasetName: 'Schulen' });

    expect(layers.drawOrder()).toEqual(['georesource:g-2']);
  });

  it('drops all georesource layers after a catalogue reload and leaves the others', () => {
    service.addPoiGeoresource(poiDataset('g-1'), '2024-01-01', true);
    service.addPoiGeoresource(poiDataset('g-2', 'Kitas'), '2024-01-01', false);
    layers.register({
      id: 'file:a',
      groupId: 'temporary',
      title: 'a',
      kind: 'vector',
      symbol: { kind: 'fill', color: '#ff0000' },
      layer: L.featureGroup(),
    });

    service.clearAfterCatalogReload();

    expect(layers.drawOrder()).toEqual(['file:a']);
  });

  it('zooms through the registry', () => {
    const zoomTo = jest.spyOn(layers, 'zoomTo');

    service.zoomToLayer({ georesourceId: 'g-1' });

    expect(zoomTo).toHaveBeenCalledWith('georesource:g-1');
  });
});
