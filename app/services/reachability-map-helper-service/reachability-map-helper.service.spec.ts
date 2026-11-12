import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReachabilityMapHelperService } from './reachability-map-helper.service';

describe('ReachabilityMapHelperService', () => {
  let service: ReachabilityMapHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityMapHelperService);
  });

  describe('panes of the isochrone layers', () => {
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

    /** The panes of all paths inside the feature group of GeoJSON layers. */
    function pathPanes(group: any): string[] {
      return group
        .getLayers()
        .flatMap((geoJson: any) => geoJson.getLayers())
        .map((path: any) => path.options.pane);
    }

    function isochroneLayer(pane?: string) {
      return service.makeIsochroneLayer(
        'Test',
        isochrones(),
        'foot-walking',
        'distance',
        [500, 1000],
        false,
        false,
        pane
      );
    }

    it('draws isochrones into overlayPane without a pane', () => {
      expect(pathPanes(isochroneLayer())).toEqual(['overlayPane', 'overlayPane']);
    });

    it('draws isochrones into the given pane', () => {
      expect(pathPanes(isochroneLayer('mapLayer1'))).toEqual(['mapLayer1', 'mapLayer1']);
    });

    it('puts the start points and their shadows into the given pane', () => {
      const points = [
        [7.4, 51.5],
        [7.5, 51.6],
      ];

      const inPane = service.makeIsochroneMarkerLayer(points, 'mapLayer1').getLayers();
      const plain = service.makeIsochroneMarkerLayer(points).getLayers();

      expect(inPane.map((marker: any) => [marker.options.pane, marker.options.shadowPane])).toEqual(
        [
          ['mapLayer1', 'mapLayer1'],
          ['mapLayer1', 'mapLayer1'],
        ]
      );
      expect(plain.map((marker: any) => [marker.options.pane, marker.options.shadowPane])).toEqual([
        ['markerPane', 'shadowPane'],
        ['markerPane', 'shadowPane'],
      ]);
    });
  });
});
