import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MapContext } from 'services/map-service/map-context';

import { ReachabilityLayerManagerService } from './reachability-layer-manager.service';

const ISOCHRONES = 'reachability:scenario:isochrones';
const START = 'reachability:scenario:start';

function scenario(datasetName = 'Schulen', transitMode = 'foot-walking') {
  const polygon = (value: number) => ({
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
  });
  return {
    isochrones_dissolved: { type: 'FeatureCollection', features: [polygon(500), polygon(1000)] },
    reachabilitySettings: {
      transitMode,
      focus: 'distance',
      rangeArray: [500, 1000],
      useMultipleStartPoints: false,
      dissolveIsochrones: false,
      selectedStartPointLayer: {
        datasetName,
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: [7.45, 51.52] },
            },
          ],
        },
      },
    },
  };
}

describe('ReachabilityLayerManagerService', () => {
  let service: ReachabilityLayerManagerService;
  let layers: MapLayerRegistry;
  let context: MapContext;
  let register: jest.SpyInstance;

  const registeredLayer = (id: string): any =>
    register.mock.calls.filter(([registration]) => registration.id === id).at(-1)[0].layer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityLayerManagerService);
    layers = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    register = jest.spyOn(layers, 'register');
    context = {
      map: { invalidateSize: jest.fn() },
      layers,
      hideLoadingIcon: jest.fn(),
    };
    service.initialize(context);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('registers isochrones and start points, the start points on top', () => {
    const zoomTo = jest.spyOn(layers, 'zoomTo');

    service.replaceScenario(scenario());

    expect(layers.entry(ISOCHRONES)).toMatchObject({
      groupId: 'reachability',
      title: 'Isochronen (Szenario)',
      subtitle: 'Schulen · foot-walking',
      kind: 'vector',
      symbol: { kind: 'isochrone' },
      capabilities: expect.objectContaining({ searchable: false }),
    });
    expect(layers.entry(START)).toMatchObject({ kind: 'marker', subtitle: 'Schulen' });
    expect(layers.drawOrder()).toEqual([START, ISOCHRONES]);
    expect(zoomTo).toHaveBeenCalledWith(ISOCHRONES);
    expect(TestBed.inject(MapOverlayStateService).reachabilityScenarioOnMainMap).toBe(true);
  });

  it('draws paths and markers into the panes of their entries', () => {
    service.replaceScenario(scenario());

    const paths = registeredLayer(ISOCHRONES)
      .getLayers()
      .flatMap((geoJson: any) => geoJson.getLayers());
    const markers = registeredLayer(START).getLayers();
    expect(paths.map((path: any) => path.options.pane)).toEqual([
      layers.paneFor(ISOCHRONES),
      layers.paneFor(ISOCHRONES),
    ]);
    expect(markers.map((marker: any) => [marker.options.pane, marker.options.shadowPane])).toEqual([
      [layers.paneFor(START), layers.paneFor(START)],
    ]);
  });

  it('replaces a previous scenario, keeps its opacity and shows it again', () => {
    service.replaceScenario(scenario());
    layers.setOpacity(ISOCHRONES, 0.5);
    layers.setVisible(START, false);

    service.replaceScenario(scenario('Kitas', 'cycling-regular'));

    expect(layers.drawOrder()).toEqual([START, ISOCHRONES]);
    expect(layers.entry(ISOCHRONES)).toMatchObject({
      subtitle: 'Kitas · cycling-regular',
      opacity: 0.5,
      visible: true,
    });
    expect(layers.entry(START)?.visible).toBe(true);
  });

  it('removes both layers of the scenario', () => {
    service.replaceScenario(scenario());

    service.removeScenario();

    expect(layers.drawOrder()).toEqual([]);
    expect(TestBed.inject(MapOverlayStateService).reachabilityScenarioOnMainMap).toBe(false);
  });

  it.each([ISOCHRONES, START])(
    'takes the whole scenario off the map when %s is removed in the layer panel',
    (id) => {
      service.replaceScenario(scenario());
      expect(layers.entry(id)!.capabilities.remove).toBe(true);

      layers.remove(id);

      expect(layers.drawOrder()).toEqual([]);
      expect(TestBed.inject(MapOverlayStateService).reachabilityScenarioOnMainMap).toBe(false);
    }
  );
});
