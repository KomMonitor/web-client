import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { SpatialUnitEditMetadataModalComponent } from './spatial-unit-edit-metadata-modal.component';

/**
 * Safety net for the two hand-written validation flags and the outline
 * defaults, ahead of the typing / Reactive-Forms rework. This modal had no
 * spec at all. The fixture is deliberately never rendered, following the other
 * modal specs in this repo.
 */

const SPATIAL_UNITS = [
  { spatialUnitId: 'su-1', spatialUnitLevel: 'Stadt' },
  { spatialUnitId: 'su-2', spatialUnitLevel: 'Stadtteile' },
  { spatialUnitId: 'su-3', spatialUnitLevel: 'Baublöcke' },
];

describe('SpatialUnitEditMetadataModalComponent', () => {
  let component: SpatialUnitEditMetadataModalComponent;
  let fixture: ComponentFixture<SpatialUnitEditMetadataModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SpatialUnitEditMetadataModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        {
          provide: EnvConfigService,
          useValue: { updateIntervalOptions: [], baseUrlToKomMonitorDataAPI: '' },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: { availableSpatialUnits: SPATIAL_UNITS },
        },
        { provide: KommonitorDataGridHelperService, useValue: {} },
        {
          provide: BroadcastService,
          useValue: { currentBroadcastMsg: new BehaviorSubject<any>({ msg: '' }) },
        },
        {
          provide: NotificationService,
          useValue: { showSuccess: jest.fn(), showError: jest.fn() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(SpatialUnitEditMetadataModalComponent);
    component = fixture.componentInstance;
    component.availableSpatialUnits = SPATIAL_UNITS;
    component.currentSpatialUnitDataset = SPATIAL_UNITS[1] as never;
    component.spatialUnitLevel = 'Stadtteile';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------

  describe('checkSpatialUnitName', () => {
    it('accepts the dataset keeping its own name', () => {
      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });

    it('rejects the name of another spatial unit', () => {
      component.spatialUnitLevel = 'Baublöcke';

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(true);
    });

    it('accepts a name nobody else uses', () => {
      component.spatialUnitLevel = 'Quartiere';

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });

    it('clears a previous verdict on re-check', () => {
      component.spatialUnitLevel = 'Baublöcke';
      component.checkSpatialUnitName();

      component.spatialUnitLevel = 'Quartiere';
      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('checkSpatialUnitHierarchy', () => {
    it('accepts a lower level that is finer than the upper one', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[2];
      component.nextUpperHierarchySpatialUnit = SPATIAL_UNITS[0];

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });

    it('rejects a lower level that is coarser than the upper one', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[0];
      component.nextUpperHierarchySpatialUnit = SPATIAL_UNITS[2];

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(true);
    });

    it('rejects the same level on both ends', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[1];
      component.nextUpperHierarchySpatialUnit = SPATIAL_UNITS[1];

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(true);
    });

    it('stays valid while only one end is selected', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[0];
      component.nextUpperHierarchySpatialUnit = null;

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });

    it('stays valid when a selected level is unknown to the store', () => {
      // Was rejected here: the index variables start at -1, so two unknown
      // levels compared as `-1 <= -1`. The add-modal twin treated them as valid
      // (its variables started `undefined`); the shared validator unifies both
      // on the add-modal behaviour.
      component.nextLowerHierarchySpatialUnit = { spatialUnitLevel: 'Fremd' };
      component.nextUpperHierarchySpatialUnit = { spatialUnitLevel: 'Auch fremd' };

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('outline defaults', () => {
    it('starts with the edit-modal outline defaults', () => {
      expect(component.isOutlineLayer).toBe(false);
      expect(component.outlineColor).toBe('#bf3d2c');
      expect(component.outlineWidth).toBe(2);
    });

    it('keeps the selected pattern reachable for the patch body', () => {
      const pattern = { label: 'gestrichelt', dashArrayValue: '5,5', svgString: '' };

      component.onChangeOutlineDashArray(pattern);

      expect(component.selectedOutlineDashArrayObject).toBe(pattern);
    });
  });
});
