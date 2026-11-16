import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import * as L from 'leaflet';

import { GenericMapHelperService } from './generic-map-helper.service';

describe('GenericMapHelperService', () => {
  let service: GenericMapHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GenericMapHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('panes of POI markers', () => {
    const feature = () => ({
      type: 'Feature',
      properties: { name: 'Schule' },
      geometry: { type: 'Point', coordinates: [7.4, 51.5] },
    });

    function marker(style: string, pane?: string) {
      return service.createCustomMarker(feature(), style, 'A', 'white', 'blue', 'home', {}, pane);
    }

    it('leaves markers in the default panes without a pane', () => {
      const { options } = marker('symbol');

      expect(options.pane).toBe('markerPane');
      expect(options.shadowPane).toBe('shadowPane');
    });

    it('puts icon and shadow into the given pane', () => {
      const { options } = marker('symbol', 'mapLayer1');

      expect(options.pane).toBe('mapLayer1');
      expect(options.shadowPane).toBe('mapLayer1');
    });

    it('puts the label of a text-style POI into the given pane, else into tooltipPane', () => {
      expect(marker('text', 'mapLayer1').getTooltip().options.pane).toBe('mapLayer1');
      expect(marker('text').getTooltip().options.pane).toBe('tooltipPane');
    });

    it('hands the pane on to the markers it makes from WFS points', () => {
      const wfsLayer = {
        _layers: {
          a: { feature: feature(), _latlng: L.latLng(51.5, 7.4) },
          b: { feature: feature(), _latlng: L.latLng(51.6, 7.5) },
        },
      };
      const dataset = {
        poiMarkerStyle: 'symbol',
        poiSymbolColor: 'white',
        poiMarkerColor: 'blue',
        poiSymbolBootstrap3Name: 'home',
      };

      const markers = service.createCustomMarkersFromWfsPoints(
        wfsLayer,
        L.featureGroup(),
        dataset,
        'mapLayer1'
      );

      expect(markers.getLayers().map((layer: any) => layer.options.pane)).toEqual([
        'mapLayer1',
        'mapLayer1',
      ]);
    });
  });
});
