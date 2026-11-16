import { TestBed } from '@angular/core/testing';

import { Georessource, GeoressourceExportItem, Indicator, IndicatorExportItem } from './models';
import { ExportingStateService } from './exporting-state.service';

const LS_INDICATOR_ITEMS = 'kommonitor.export.indicatorItems';
const LS_GEORESSOURCE_ITEMS = 'kommonitor.export.georessourceItems';

function indicator(id: string, spatialUnitIds: string[] = ['su-1']): Indicator {
  return {
    id,
    name: id,
    spatialUnits: spatialUnitIds.map((suId) => ({ id: suId, name: suId })),
    availableTimestamps: [],
  };
}

function georessource(id: string): Georessource {
  return { id, name: id, availableTimestamps: [] };
}

function indicatorItem(
  id: string,
  overrides: Partial<IndicatorExportItem> = {}
): IndicatorExportItem {
  return {
    dataset: indicator(id),
    selectedFormats: [],
    selectedSpatialUnitIds: [],
    ...overrides,
  };
}

function georessourceItem(
  id: string,
  overrides: Partial<GeoressourceExportItem> = {}
): GeoressourceExportItem {
  return { dataset: georessource(id), selectedFormats: [], ...overrides };
}

describe('ExportingStateService', () => {
  afterEach(() => {
    localStorage.removeItem(LS_INDICATOR_ITEMS);
    localStorage.removeItem(LS_GEORESSOURCE_ITEMS);
  });

  describe('construction', () => {
    it('defaults to the single export type with no persisted items', () => {
      const service = TestBed.inject(ExportingStateService);

      expect(service.exportType()).toBe('single');
      expect(service.selectedEpsgCode()).toBe(4326);
      expect(service.indicatorItems()).toEqual([]);
      expect(service.georessourceItems()).toEqual([]);
    });

    it('restores previously persisted items from localStorage', () => {
      localStorage.setItem(LS_INDICATOR_ITEMS, JSON.stringify([indicatorItem('i-1')]));
      localStorage.setItem(LS_GEORESSOURCE_ITEMS, JSON.stringify([georessourceItem('g-1')]));

      const service = TestBed.inject(ExportingStateService);

      expect(service.indicatorItems().map((item) => item.dataset.id)).toEqual(['i-1']);
      expect(service.georessourceItems().map((item) => item.dataset.id)).toEqual(['g-1']);
    });

    it('falls back to an empty list when the stored value is corrupt JSON', () => {
      localStorage.setItem(LS_INDICATOR_ITEMS, '{not json');

      const service = TestBed.inject(ExportingStateService);

      expect(service.indicatorItems()).toEqual([]);
    });
  });

  describe('with a fresh service instance', () => {
    let service: ExportingStateService;

    beforeEach(() => {
      service = TestBed.inject(ExportingStateService);
    });

    describe('addIndicator / addGeoressource', () => {
      it('adds a new indicator item for a not-yet-exported indicator', () => {
        service.addIndicator(indicator('i-1'));

        expect(service.indicatorItems()).toEqual([
          { dataset: indicator('i-1'), selectedFormats: [], selectedSpatialUnitIds: [] },
        ]);
      });

      it('does not add the same indicator twice', () => {
        service.addIndicator(indicator('i-1'));
        service.addIndicator(indicator('i-1'));

        expect(service.indicatorItems().length).toBe(1);
      });

      it('does not add the same georessource twice', () => {
        service.addGeoressource(georessource('g-1'));
        service.addGeoressource(georessource('g-1'));

        expect(service.georessourceItems().length).toBe(1);
      });
    });

    describe('removeIndicator / removeGeoressource', () => {
      it('removes only the matching indicator item', () => {
        service.indicatorItems.set([indicatorItem('i-1'), indicatorItem('i-2')]);

        service.removeIndicator('i-1');

        expect(service.indicatorItems().map((item) => item.dataset.id)).toEqual(['i-2']);
      });

      it('removes only the matching georessource item', () => {
        service.georessourceItems.set([georessourceItem('g-1'), georessourceItem('g-2')]);

        service.removeGeoressource('g-1');

        expect(service.georessourceItems().map((item) => item.dataset.id)).toEqual(['g-2']);
      });
    });

    describe('toggleSpatialUnit', () => {
      it('adds a spatial unit id the first time and removes it the second time', () => {
        const item = indicatorItem('i-1');
        service.indicatorItems.set([item]);

        service.toggleSpatialUnit(item, 'su-1');
        expect(service.indicatorItems()[0].selectedSpatialUnitIds).toEqual(['su-1']);

        service.toggleSpatialUnit(service.indicatorItems()[0], 'su-1');
        expect(service.indicatorItems()[0].selectedSpatialUnitIds).toEqual([]);
      });

      it('leaves other items untouched', () => {
        const item1 = indicatorItem('i-1');
        const item2 = indicatorItem('i-2');
        service.indicatorItems.set([item1, item2]);

        service.toggleSpatialUnit(item1, 'su-1');

        expect(
          service.indicatorItems().find((i) => i.dataset.id === 'i-2')!.selectedSpatialUnitIds
        ).toEqual([]);
      });
    });

    describe('toggleFormat', () => {
      it('toggles the format on the matching indicator item', () => {
        service.indicatorItems.set([indicatorItem('i-1')]);

        service.toggleFormat('i-1', 'Excel');
        expect(service.indicatorItems()[0].selectedFormats).toEqual(['Excel']);

        service.toggleFormat('i-1', 'Excel');
        expect(service.indicatorItems()[0].selectedFormats).toEqual([]);
      });

      it('toggles the format on the matching georessource item', () => {
        service.georessourceItems.set([georessourceItem('g-1')]);

        service.toggleFormat('g-1', 'CSV');

        expect(service.georessourceItems()[0].selectedFormats).toEqual(['CSV']);
      });
    });

    it('toggleSpatialUnitFormat toggles a format in the shared spatial-unit format list', () => {
      service.toggleSpatialUnitFormat('GeoPackage');
      expect(service.selectedSpatialUnitFormats()).toEqual(['GeoPackage']);

      service.toggleSpatialUnitFormat('GeoPackage');
      expect(service.selectedSpatialUnitFormats()).toEqual([]);
    });

    describe('isSingleExportValid', () => {
      it('is false with no items', () => {
        expect(service.isSingleExportValid()).toBe(false);
      });

      it('is true once an indicator item has both a spatial unit and a format selected', () => {
        service.indicatorItems.set([
          indicatorItem('i-1', { selectedSpatialUnitIds: ['su-1'], selectedFormats: ['CSV'] }),
        ]);
        expect(service.isSingleExportValid()).toBe(true);
      });

      it('is true once a georessource item has a format selected', () => {
        service.georessourceItems.set([georessourceItem('g-1', { selectedFormats: ['CSV'] })]);
        expect(service.isSingleExportValid()).toBe(true);
      });
    });

    describe('isSpatialUnitExportValid', () => {
      it('requires a selected spatial unit, a format and at least one indicator item', () => {
        expect(service.isSpatialUnitExportValid()).toBe(false);

        service.indicatorItems.set([indicatorItem('i-1')]);
        service.selectedSpatialUnit.set('Gesamtstadt');
        expect(service.isSpatialUnitExportValid()).toBe(false);

        service.selectedSpatialUnitFormats.set(['CSV']);
        expect(service.isSpatialUnitExportValid()).toBe(true);
      });
    });

    describe('isMultipleExportValid', () => {
      it('requires GeoPackage specifically plus a selected spatial unit', () => {
        service.indicatorItems.set([
          indicatorItem('i-1', { selectedFormats: ['CSV'], selectedSpatialUnitIds: ['su-1'] }),
        ]);
        expect(service.isMultipleExportValid()).toBe(false);

        service.indicatorItems.set([
          indicatorItem('i-1', {
            selectedFormats: ['GeoPackage'],
            selectedSpatialUnitIds: ['su-1'],
          }),
        ]);
        expect(service.isMultipleExportValid()).toBe(true);
      });
    });

    describe('isIndicatorItemValid', () => {
      it('checks per-item spatial units and formats for single/multiple export', () => {
        service.exportType.set('single');
        expect(
          service.isIndicatorItemValid(
            indicatorItem('i-1', { selectedSpatialUnitIds: ['su-1'], selectedFormats: ['CSV'] })
          )
        ).toBe(true);
        expect(service.isIndicatorItemValid(indicatorItem('i-1'))).toBe(false);
      });

      it('checks the shared spatial-unit selection for spatialUnit export', () => {
        service.exportType.set('spatialUnit');
        expect(service.isIndicatorItemValid(indicatorItem('i-1'))).toBe(false);

        service.selectedSpatialUnit.set('Gesamtstadt');
        service.selectedSpatialUnitFormats.set(['CSV']);
        expect(service.isIndicatorItemValid(indicatorItem('i-1'))).toBe(true);
      });
    });

    it('isGeoressourceItemValid requires at least one selected format', () => {
      expect(service.isGeoressourceItemValid(georessourceItem('g-1'))).toBe(false);
      expect(
        service.isGeoressourceItemValid(georessourceItem('g-1', { selectedFormats: ['CSV'] }))
      ).toBe(true);
    });

    describe('commonSpatialUnits', () => {
      it('is empty with no indicator items', () => {
        expect(service.commonSpatialUnits()).toEqual([]);
      });

      it('returns only the spatial units shared by every indicator item', () => {
        service.indicatorItems.set([
          indicatorItem('i-1', { dataset: indicator('i-1', ['su-1', 'su-2']) }),
          indicatorItem('i-2', { dataset: indicator('i-2', ['su-2']) }),
        ]);

        expect(service.commonSpatialUnits().map((u) => u.id)).toEqual(['su-2']);
      });
    });

    it('persists indicator and georessource items to localStorage', () => {
      service.indicatorItems.set([indicatorItem('i-1')]);
      service.georessourceItems.set([georessourceItem('g-1')]);
      TestBed.tick();

      expect(
        JSON.parse(localStorage.getItem(LS_INDICATOR_ITEMS)!).map((i: any) => i.dataset.id)
      ).toEqual(['i-1']);
      expect(
        JSON.parse(localStorage.getItem(LS_GEORESSOURCE_ITEMS)!).map((i: any) => i.dataset.id)
      ).toEqual(['g-1']);
    });
  });
});
