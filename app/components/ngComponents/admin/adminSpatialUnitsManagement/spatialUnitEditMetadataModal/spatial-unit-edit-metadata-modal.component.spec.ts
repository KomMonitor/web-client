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
import { SpatialUnitHierarchyApiService } from 'services/spatial-unit-hierarchy-service/spatial-unit-hierarchy-api.service';

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

const HIERARCHIES = [
  {
    hierarchyId: 'h-1',
    name: 'Verwaltung',
    mandantId: 'm-1',
    isPublic: false,
    members: [{ spatialUnitId: 'su-1', hierarchyLevel: 0 }],
  },
  { hierarchyId: 'h-2', name: 'Sozialraum', mandantId: 'm-1', isPublic: false, members: [] },
  { hierarchyId: 'h-x', name: 'Fremd', mandantId: 'm-2', isPublic: false, members: [] },
];

describe('SpatialUnitEditMetadataModalComponent', () => {
  let component: SpatialUnitEditMetadataModalComponent;
  let fixture: ComponentFixture<SpatialUnitEditMetadataModalComponent>;
  let hierarchyApi: { getHierarchies: jest.Mock; updateMemberships: jest.Mock };

  beforeEach(() => {
    hierarchyApi = {
      getHierarchies: jest.fn().mockResolvedValue(HIERARCHIES),
      updateMemberships: jest.fn().mockResolvedValue({}),
    };

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
        { provide: SpatialUnitHierarchyApiService, useValue: hierarchyApi },
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

  // ---------------------------------------------------------------------------

  describe('hierarchy placement', () => {
    /** Runs ngOnInit and lets the awaited hierarchy fetch settle. */
    async function initWith(dataset: Record<string, unknown>): Promise<void> {
      component.currentSpatialUnitDataset = dataset as never;
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();
    }

    it("offers only the hierarchies of the dataset's own tenant", async () => {
      await initWith({ spatialUnitId: 'su-1', spatialUnitLevel: 'Stadt', mandantId: 'm-1' });

      expect(component.availableHierarchies.map((entry) => entry.hierarchyId)).toEqual([
        'h-1',
        'h-2',
      ]);
    });

    it('offers everything it got where the dataset names no tenant', async () => {
      await initWith({ spatialUnitId: 'su-1', spatialUnitLevel: 'Stadt' });

      expect(component.availableHierarchies).toHaveLength(3);
    });

    it('shows the hierarchy the dataset already belongs to', async () => {
      await initWith({
        spatialUnitId: 'su-1',
        spatialUnitLevel: 'Stadt',
        mandantId: 'm-1',
        hierarchies: [{ hierarchyId: 'h-1', hierarchyLevel: 0 }],
      });

      expect(component.editForm.controls.hierarchyId.value).toBe('h-1');
    });

    it('shows no hierarchy for an unassigned dataset', async () => {
      await initWith({ spatialUnitId: 'su-1', spatialUnitLevel: 'Stadt', mandantId: 'm-1' });

      expect(component.editForm.controls.hierarchyId.value).toBe('');
    });

    it('writes nothing when the assignment is unchanged', async () => {
      await initWith({
        spatialUnitId: 'su-1',
        spatialUnitLevel: 'Stadt',
        mandantId: 'm-1',
        hierarchies: [{ hierarchyId: 'h-1', hierarchyLevel: 0 }],
      });

      await (
        component as never as { saveHierarchyPlacement(): Promise<void> }
      ).saveHierarchyPlacement();

      expect(hierarchyApi.updateMemberships).not.toHaveBeenCalled();
    });

    it('appends the dataset as the finest level of a newly picked hierarchy', async () => {
      await initWith({
        spatialUnitId: 'su-1',
        spatialUnitLevel: 'Stadt',
        mandantId: 'm-1',
        hierarchies: [],
      });
      component.editForm.controls.hierarchyId.setValue('h-1');

      await (
        component as never as { saveHierarchyPlacement(): Promise<void> }
      ).saveHierarchyPlacement();

      // h-1 already holds one member, so the new one lands at level 1.
      expect(hierarchyApi.updateMemberships).toHaveBeenCalledWith('su-1', [
        { hierarchyId: 'h-1', hierarchyLevel: 1 },
      ]);
    });

    it('clears the membership when the hierarchy is unset', async () => {
      await initWith({
        spatialUnitId: 'su-1',
        spatialUnitLevel: 'Stadt',
        mandantId: 'm-1',
        hierarchies: [{ hierarchyId: 'h-1', hierarchyLevel: 0 }],
      });
      component.editForm.controls.hierarchyId.setValue('');

      await (
        component as never as { saveHierarchyPlacement(): Promise<void> }
      ).saveHierarchyPlacement();

      expect(hierarchyApi.updateMemberships).toHaveBeenCalledWith('su-1', []);
    });
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
