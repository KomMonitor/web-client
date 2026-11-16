import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import domtoimage from 'dom-to-image-more';
import { saveAs } from 'file-saver';
import * as L from 'leaflet';

import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { GeoresourceLayerManagerService } from 'services/georesource-layer-manager-service/georesource-layer-manager.service';
import { MainMapLayersService } from 'services/map-layer-registry-service/map-layer-registry.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { OgcLayerManagerService } from 'services/ogc-layer-manager-service/ogc-layer-manager.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { KommonitorMapComponent } from './kommonitor-map.component';

jest.mock('dom-to-image-more', () => ({ __esModule: true, default: { toBlob: jest.fn() } }));
jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

describe('KommonitorMapComponent', () => {
  let component: KommonitorMapComponent;
  let fixture: ComponentFixture<KommonitorMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorMapComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorMapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filterForScreenshot', () => {
    // dom-to-image walks every child node, including plain text nodes, whose
    // `className` is `undefined` rather than a string - a prior version called
    // `.includes` on it unconditionally and crashed the whole export on any
    // map text (labels, popups, attribution).
    it('keeps a text node instead of throwing on its missing className', () => {
      const textNode = document.createTextNode('some label text');

      expect(() => component.filterForScreenshot(textNode)).not.toThrow();
      expect(component.filterForScreenshot(textNode)).toBe(true);
    });

    it('excludes a leaflet control element', () => {
      const control = document.createElement('div');
      control.className = 'leaflet-control-zoom leaflet-control';

      expect(component.filterForScreenshot(control)).toBe(false);
    });

    it('keeps a plain map element', () => {
      const tile = document.createElement('img');
      tile.className = 'leaflet-tile';

      expect(component.filterForScreenshot(tile)).toBe(true);
    });

    it('excludes buttons and links regardless of their class', () => {
      expect(component.filterForScreenshot(document.createElement('button'))).toBe(false);
      expect(component.filterForScreenshot(document.createElement('a'))).toBe(false);
    });
  });

  describe('exportMap', () => {
    let ngMapNode: HTMLDivElement;

    beforeEach(() => {
      jest.useFakeTimers();
      // #ngMap is only rendered by the component's own template, which these
      // specs never trigger (no fixture.detectChanges()) - a bare stand-in is
      // enough since exportMap only reads it via document.getElementById.
      ngMapNode = document.createElement('div');
      ngMapNode.id = 'ngMap';
      document.body.appendChild(ngMapNode);
      (component as unknown as { map: unknown }).map = { getSize: () => ({ x: 10, y: 10 }) };
      component.loadingData = false;
      (domtoimage.toBlob as jest.Mock).mockReset();
      (saveAs as jest.Mock).mockReset();
    });

    afterEach(() => {
      document.body.removeChild(ngMapNode);
      jest.useRealTimers();
    });

    it('shows the loading overlay while the screenshot is generated and hides it again on success', async () => {
      const blob = new Blob();
      (domtoimage.toBlob as jest.Mock).mockResolvedValue(blob);

      const exported = component.exportMap();
      expect(component.loadingData).toBe(true);

      await exported;
      jest.advanceTimersByTime(250);

      expect(saveAs).toHaveBeenCalledWith(blob, 'KomMonitor-Screenshot.png');
      expect(component.loadingData).toBe(false);
    });

    it('hides the loading overlay again when the screenshot fails', async () => {
      (domtoimage.toBlob as jest.Mock).mockRejectedValue(new Error('tainted canvas'));

      const exported = component.exportMap();
      expect(component.loadingData).toBe(true);

      await exported;
      jest.advanceTimersByTime(250);

      expect(saveAs).not.toHaveBeenCalled();
      expect(component.loadingData).toBe(false);
    });
  });

  describe('live reachability result', () => {
    const START = 'reachability:live:start';
    const ISOCHRONES = 'reachability:live:isochrones';
    let map: { getZoom: jest.Mock; getBoundsZoom: jest.Mock; setView: jest.Mock };

    const point = (lon: number, lat: number) =>
      ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [lon, lat] },
      }) as any;
    const isochrones = () => ({
      type: 'FeatureCollection',
      features: [500, 1000].map((value) => ({
        type: 'Feature',
        properties: { value },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [7.4, 51.5],
              [7.5, 51.5],
              [7.45, 51.55],
              [7.4, 51.5],
            ],
          ],
        },
      })),
    });
    const registry = () => TestBed.inject(MainMapLayersService).registry;
    const registeredLayer = (spy: jest.SpyInstance, id: string): any =>
      spy.mock.calls.filter(([registration]) => registration.id === id).at(-1)[0].layer;

    beforeEach(() => {
      map = { getZoom: jest.fn(() => 12), getBoundsZoom: jest.fn(() => 15), setView: jest.fn() };
      (component as unknown as { map: unknown }).map = map;
      (component as any).reachabilityStateService.settings = {
        transitMode: 'foot-walking',
        focus: 'distance',
        rangeArray: [500, 1000],
        useMultipleStartPoints: false,
        dissolveIsochrones: false,
      };
    });

    it('registers the start points in their pane and only ever zooms out to show them', () => {
      const register = jest.spyOn(registry(), 'register');

      component.addSingleMarker([point(7.4, 51.5), point(7.5, 51.6)]);

      expect(registry().entry(START)).toMatchObject({
        groupId: 'reachability',
        title: 'Startpunkte (live)',
        subtitle: 'Manuelle Eingabe',
        kind: 'marker',
      });
      const pane = registry().paneFor(START);
      expect(
        registeredLayer(register, START)
          .getLayers()
          .map((marker: any) => marker.options.pane)
      ).toEqual([pane, pane]);
      expect(map.setView).toHaveBeenCalledWith(expect.anything(), 12);
    });

    it('replaces the start points and removes them for an empty list', () => {
      component.addSingleMarker([point(7.4, 51.5)]);
      component.addSingleMarker([point(7.4, 51.5), point(7.5, 51.6)]);
      expect(registry().drawOrder()).toEqual([START]);

      component.addSingleMarker([]);

      expect(registry().entry(START)).toBeUndefined();
    });

    it('puts new isochrones below the start points, in their own pane', () => {
      const register = jest.spyOn(registry(), 'register');
      component.addSingleMarker([point(7.45, 51.52)]);

      component.addIsochrones(isochrones());

      expect(registry().entry(ISOCHRONES)).toMatchObject({
        title: 'Isochronen (live)',
        subtitle: 'Manuelle Eingabe · foot-walking',
        kind: 'vector',
        symbol: { kind: 'isochrone' },
      });
      expect(registry().drawOrder()).toEqual([START, ISOCHRONES]);
      const paths = registeredLayer(register, ISOCHRONES)
        .getLayers()
        .flatMap((geoJson: any) => geoJson.getLayers());
      expect(paths.map((path: any) => path.options.pane)).toEqual([
        registry().paneFor(ISOCHRONES),
        registry().paneFor(ISOCHRONES),
      ]);
    });

    it('replaces the isochrones, keeps opacity and the chosen order, and shows them again', () => {
      component.addSingleMarker([point(7.45, 51.52)]);
      component.addIsochrones(isochrones());
      registry().setOpacity(ISOCHRONES, 0.5);
      registry().setVisible(ISOCHRONES, false);
      registry().moveEntry(ISOCHRONES, 0);

      component.addIsochrones(isochrones());

      expect(registry().entry(ISOCHRONES)).toMatchObject({ opacity: 0.5, visible: true });
      expect(registry().drawOrder()).toEqual([ISOCHRONES, START]);
    });

    it('gives the live layers the settings of their calculation as details', async () => {
      const settings = (component as any).reachabilityStateService.settings;
      settings.locationsArray = [[7.45, 51.52]];
      component.addSingleMarker([point(7.45, 51.52)]);
      component.addIsochrones(isochrones());
      settings.rangeArray = [1, 2];

      const details = await registry().info(ISOCHRONES);
      expect(details!.items[2].params).toEqual({ values: '500, 1000' });
      expect(details!.items[3].params).toEqual({ name: 'Manuelle Eingabe', count: 1 });
      expect((await registry().info(START))!.items[3].params).toMatchObject({ count: 1 });
    });

    it('removes the isochrones', () => {
      component.addIsochrones(isochrones());

      component.removeIsochrones();

      expect(registry().entry(ISOCHRONES)).toBeUndefined();
    });
  });

  describe('after a metadata (re)load', () => {
    const registry = () => TestBed.inject(MainMapLayersService).registry;
    const spatialUnit = (spatialUnitId: string, isOutlineLayer = true) =>
      ({
        spatialUnitId,
        spatialUnitLevel: 'Ebene ' + spatialUnitId,
        isOutlineLayer,
        outlineColor: '#ff0000',
        outlineWidth: 2,
      }) as any;
    const outlineIds = () =>
      registry()
        .drawOrder()
        .filter((id) => id.startsWith('outline:'));

    it('registers one hidden outline per outline spatial unit', () => {
      TestBed.inject(SpatialUnitMetadataStoreService).availableSpatialUnits = [
        spatialUnit('a'),
        spatialUnit('b'),
        spatialUnit('c', false),
      ];

      component.refreshSpatialUnitOutlines();

      expect(outlineIds().sort()).toEqual(['outline:a', 'outline:b']);
      expect(registry().entry('outline:a')).toMatchObject({ visible: false, status: 'idle' });
    });

    it('gives spatial unit, number of areas once loaded and source as details', async () => {
      TestBed.inject(SpatialUnitMetadataStoreService).availableSpatialUnits = [
        { ...spatialUnit('a'), metadata: { datasource: 'Stadt Essen' } },
      ];
      component.refreshSpatialUnitOutlines();

      expect((await registry().info('outline:a'))!.items).toEqual([
        { labelKey: 'MAP_LAYERS.INFO.SPATIAL_UNIT', value: 'Ebene a' },
        { labelKey: 'MAP_LAYERS.INFO.AREAS', valueKey: 'MAP_LAYERS.INFO.NOT_LOADED' },
        { labelKey: 'MAP_LAYERS.INFO.SOURCE', value: 'Stadt Essen', html: true },
      ]);

      registry().reportStatus('outline:a', 'ready');
      expect((await registry().info('outline:a'))!.items[1]).toEqual({
        labelKey: 'MAP_LAYERS.INFO.AREAS',
        value: 0,
      });
    });

    it('drops outlines of vanished spatial units and keeps the state of the others', () => {
      const store = TestBed.inject(SpatialUnitMetadataStoreService);
      store.availableSpatialUnits = [spatialUnit('a'), spatialUnit('b')];
      component.refreshSpatialUnitOutlines();
      registry().setOpacity('outline:a', 0.4);
      registry().register({
        id: 'file:x',
        groupId: 'temporary',
        title: 'x',
        kind: 'vector',
        symbol: { kind: 'fill', color: '#ff0000' },
        layer: {} as any,
      });

      store.availableSpatialUnits = [spatialUnit('a')];
      component.refreshSpatialUnitOutlines();

      expect(outlineIds()).toEqual(['outline:a']);
      expect(registry().entry('outline:a')?.opacity).toBe(0.4);
      expect(registry().entry('file:x')).toBeDefined();
    });

    it('drops the georesource and WMS layers of the reloaded catalogues, once the map is there', () => {
      const clearGeoresources = jest
        .spyOn(TestBed.inject(GeoresourceLayerManagerService), 'clearAfterCatalogReload')
        .mockImplementation(() => undefined);
      const clearWms = jest
        .spyOn(TestBed.inject(OgcLayerManagerService), 'clearWmsAfterCatalogReload')
        .mockImplementation(() => undefined);
      TestBed.inject(MetadataBootstrapService).setMetadataState(MetadataLoadingState.COMPLETE);

      (component as any).onMetadataLoaded();
      expect(clearGeoresources).not.toHaveBeenCalled();

      (component as unknown as { map: unknown }).map = {};
      (component as any).onMetadataLoaded();
      expect(clearGeoresources).toHaveBeenCalledTimes(1);
      expect(clearWms).toHaveBeenCalledTimes(1);
    });
  });

  describe('highlighting features (map commands, e.g. from diagrams)', () => {
    const HOVER = '#e01414';
    const CLICKED = '#42e5f4';
    let map: { eachLayer: jest.Mock };
    let outline: L.GeoJSON;

    const collection = () => ({
      type: 'FeatureCollection',
      features: ['A', 'B'].map((name, index) => ({
        type: 'Feature',
        properties: { NAME: name, ID: name },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [7 + index, 51],
              [7.5 + index, 51],
              [7.5 + index, 51.5],
              [7 + index, 51],
            ],
          ],
        },
      })),
    });
    const feature = (layer: L.GeoJSON, name: string): any =>
      layer.getLayers().find((l: any) => l.feature.properties.NAME === name);
    const indicator = () => (component as any).currentIndicatorLayer as L.GeoJSON;

    beforeEach(() => {
      Object.assign((window as any).__env, {
        FEATURE_NAME_PROPERTY_NAME: 'NAME',
        FEATURE_ID_PROPERTY_NAME: 'ID',
        defaultColorForHoveredFeatures: HOVER,
        defaultColorForClickedFeatures: CLICKED,
      });
      map = { eachLayer: jest.fn() };
      (component as unknown as { map: unknown }).map = map;
      (component as any).currentIndicatorLayer = L.geoJSON(collection() as any, {
        style: { color: 'black', weight: 1 },
      });
      // an outline of the same spatial unit: same names and ids, not the indicator
      outline = L.geoJSON(collection() as any, { style: { color: 'red', weight: 2 } });
      TestBed.inject(FilterHelperService).clearSelectedFeatures();
    });

    it('highlights the indicator feature only', () => {
      component.highlightFeatureOnMap('A');

      expect(feature(indicator(), 'A').options).toMatchObject({ color: HOVER, weight: 3 });
      expect(feature(outline, 'A').options).toMatchObject({ color: 'red', weight: 2 });
      expect(map.eachLayer).not.toHaveBeenCalled();
    });

    it('resets the hover style of the indicator feature', () => {
      const reset = jest
        .spyOn(component, 'resetHighlightForLayer')
        .mockImplementation(() => undefined);

      component.unhighlightFeatureOnMap('A');

      expect(reset).toHaveBeenCalledWith(feature(indicator(), 'A'));
    });

    it('selects and deselects a feature from a diagram without throwing', () => {
      const deselect = jest
        .spyOn(component, 'resetHighlightClickedFeature')
        .mockImplementation(() => undefined);
      const filterHelper = TestBed.inject(FilterHelperService);

      expect(() => component.switchHighlightFeatureOnMap('B')).not.toThrow();
      expect(filterHelper.featureIsCurrentlySelected('B')).toBe(true);
      expect(feature(indicator(), 'B').options.color).toBe(CLICKED);
      expect(feature(outline, 'B').options.color).toBe('red');

      component.switchHighlightFeatureOnMap('B');

      expect(filterHelper.featureIsCurrentlySelected('B')).toBe(false);
      expect(deselect).toHaveBeenCalledWith(feature(indicator(), 'B'));
    });

    it('preserves the selection on the indicator features only', () => {
      TestBed.inject(FilterHelperService).addFeatureToSelection(feature(indicator(), 'B').feature);

      component.preserveHighlightedFeatures();

      expect(feature(indicator(), 'B').options.color).toBe(CLICKED);
      expect(feature(indicator(), 'A').options.color).toBe('black');
      expect(feature(outline, 'B').options.color).toBe('red');
      expect(map.eachLayer).not.toHaveBeenCalled();
    });
  });
});
