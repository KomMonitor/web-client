import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  FileHelperService,
  FileUploadState,
} from 'services/file-helper-service/file-helper.service';
import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MapContext } from 'services/map-service/map-context';

import { FileLayerManagerService } from './file-layer-manager.service';

const point = (lon: number, lat: number) => ({
  type: 'Feature',
  properties: { name: 'P' },
  geometry: { type: 'Point', coordinates: [lon, lat] },
});

const square = {
  type: 'Feature',
  properties: { name: 'F' },
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
};

function poiFile(datasetName = 'Schulen', poiMarkerColor = 'blue') {
  return {
    datasetName,
    isPOI: true,
    poiMarkerStyle: 'symbol',
    poiSymbolColor: 'white',
    poiMarkerColor,
    poiSymbolBootstrap3Name: 'home',
    geoJSON: { type: 'FeatureCollection', features: [point(7.0, 51.0), point(7.1, 51.1)] },
  };
}

function areaFile(datasetName = 'Parks', extra = {}) {
  return {
    datasetName,
    isPOI: false,
    displayColor: '#00ff00',
    geoJSON: { type: 'FeatureCollection', features: [square] },
    ...extra,
  };
}

describe('FileLayerManagerService', () => {
  let service: FileLayerManagerService;
  let layers: MapLayerRegistry;
  let context: MapContext;
  let setValue: jest.SpyInstance;
  let register: jest.SpyInstance;

  /** The Leaflet layer handed to the registry by the last registration. */
  const lastLayer = (): any => register.mock.calls.at(-1)[0].layer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FileLayerManagerService);
    setValue = jest.spyOn(TestBed.inject(FileHelperService), 'setValue');
    layers = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    register = jest.spyOn(layers, 'register');
    context = {
      map: { invalidateSize: jest.fn() },
      layerControl: { addOverlay: jest.fn(), removeLayer: jest.fn(), _layers: [] },
      layers,
      updateSearchControl: jest.fn(),
      hideLoadingIcon: jest.fn(),
    };
    service.initialize(context);
  });

  afterEach(() => jest.restoreAllMocks());

  it('registers a POI file as searchable markers among the temporary layers', () => {
    const zoomTo = jest.spyOn(layers, 'zoomTo');
    const dataset = poiFile();

    service.addFileLayer(dataset, 1);

    expect(layers.entry('file:Schulen')).toMatchObject({
      groupId: 'temporary',
      title: 'Schulen',
      kind: 'marker',
      symbol: { kind: 'point', color: 'blue' },
      opacity: 1,
      capabilities: expect.objectContaining({ searchable: true }),
    });
    const pane = layers.paneFor('file:Schulen');
    expect(
      lastLayer()
        .getLayers()
        .map((marker: any) => marker.options.pane)
    ).toEqual([pane, pane]);
    expect(zoomTo).toHaveBeenCalledWith('file:Schulen');
    expect(setValue).toHaveBeenCalledWith(FileUploadState.SUCCESS, dataset);
    expect(context.layerControl.addOverlay).not.toHaveBeenCalled();
  });

  it('registers area and line files as vectors in the pane of their entry', () => {
    service.addFileLayer(areaFile(), 0.8);
    const [path] = lastLayer().getLayers();
    service.addFileLayer(areaFile('Wege', { isLOI: true }), 1);

    expect(layers.entry('file:Parks')).toMatchObject({
      kind: 'vector',
      symbol: { kind: 'fill', color: '#00ff00' },
      opacity: 0.8,
    });
    expect(layers.entry('file:Wege')?.symbol).toEqual({ kind: 'line', color: '#00ff00' });
    expect(path.options).toMatchObject({
      pane: layers.paneFor('file:Parks'),
      fillColor: '#00ff00',
      fillOpacity: 1,
      opacity: 1,
    });
  });

  it('replaces the file layer and keeps visibility, opacity and position', () => {
    service.addFileLayer(poiFile('Schulen'), 1);
    service.addFileLayer(poiFile('Kitas'), 1);
    layers.setVisible('file:Schulen', false);
    layers.setOpacity('file:Schulen', 0.5);

    service.addFileLayer(poiFile('Schulen', 'red'), 1);

    expect(layers.entry('file:Schulen')).toMatchObject({
      symbol: { kind: 'point', color: 'red' },
      visible: false,
      opacity: 0.5,
    });
    expect(layers.drawOrder()).toEqual(['file:Kitas', 'file:Schulen']);
  });

  it('removes only its own file, not one whose name merely contains it', () => {
    service.addFileLayer(areaFile('Schulen'), 1);
    service.addFileLayer(areaFile('Schulen_2'), 1);

    service.removeFileLayer({ datasetName: 'Schulen' });

    expect(layers.drawOrder()).toEqual(['file:Schulen_2']);
    expect(context.layerControl.removeLayer).not.toHaveBeenCalled();
  });

  it('restyles the file layer with a new color', () => {
    service.addFileLayer(areaFile(), 1);
    const [path] = lastLayer().getLayers();

    service.adjustColor({ datasetName: 'Parks', displayColor: '#ff0000' });

    expect(path.options.fillColor).toBe('#ff0000');
    expect(path.options.fillOpacity).toBe(1);
  });

  it('reports a file it cannot show and registers nothing', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const dataset = { ...poiFile(), geoJSON: { type: 'FeatureCollection', features: [square] } };

    service.addFileLayer(dataset, 1);

    expect(layers.entry('file:Schulen')).toBeUndefined();
    expect(setValue).toHaveBeenCalledWith(FileUploadState.ERROR, [expect.anything(), dataset]);
  });
});
