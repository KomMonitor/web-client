import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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

import { buildAssignmentRow } from '../hierarchyAssignment/hierarchy-assignment.model';
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
    // Three levels, so a membership in the middle is distinguishable from one
    // at either end.
    members: [
      { spatialUnitId: 'su-1', spatialUnitLevel: 'Stadt', hierarchyLevel: 0 },
      { spatialUnitId: 'su-2', spatialUnitLevel: 'Stadtteile', hierarchyLevel: 1 },
      { spatialUnitId: 'su-3', spatialUnitLevel: 'Baublöcke', hierarchyLevel: 2 },
    ],
  },
  {
    hierarchyId: 'h-2',
    name: 'Sozialraum',
    mandantId: 'm-1',
    isPublic: false,
    members: [{ spatialUnitId: 'su-2', spatialUnitLevel: 'Stadtteile', hierarchyLevel: 0 }],
  },
  { hierarchyId: 'h-x', name: 'Fremd', mandantId: 'm-2', isPublic: false, members: [] },
];

/** `su-2`, which sits in the middle of h-1 and alone in h-2. */
const DATASET_IN_TWO = {
  spatialUnitId: 'su-2',
  spatialUnitLevel: 'Stadtteile',
  mandantId: 'm-1',
  hierarchies: [
    {
      hierarchyId: 'h-1',
      hierarchyName: 'Verwaltung',
      hierarchyLevel: 1,
      nextUpperSpatialUnitId: 'su-1',
      nextLowerSpatialUnitId: 'su-3',
    },
    { hierarchyId: 'h-2', hierarchyName: 'Sozialraum', hierarchyLevel: 0 },
  ],
};

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

  describe('hierarchy memberships', () => {
    /** Runs ngOnInit and lets the awaited hierarchy fetch settle. */
    async function initWith(dataset: Record<string, unknown>): Promise<void> {
      component.currentSpatialUnitDataset = dataset as never;
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();
    }

    function save(): Promise<void> {
      return (
        component as never as { saveHierarchyMemberships(): Promise<void> }
      ).saveHierarchyMemberships();
    }

    function rows() {
      return component.editForm.controls.hierarchyAssignments;
    }

    it('hands the panel every hierarchy and lets it narrow them', async () => {
      // Filtering by tenant moved into the panel, which also keeps the ones the
      // dataset is already a member of — a row whose hierarchy is missing from
      // the select would take its membership with it on the next save.
      await initWith({ spatialUnitId: 'su-1', spatialUnitLevel: 'Stadt', mandantId: 'm-1' });

      expect(component.availableHierarchies).toHaveLength(3);
    });

    it('seeds one row per membership, each at the place it already holds', async () => {
      await initWith(DATASET_IN_TWO);

      // h-1: in the middle, so it sits above the level below it.
      // h-2: its only member, so there is nothing below — an append.
      expect(rows().getRawValue()).toEqual([
        { hierarchyId: 'h-2', placement: 'append', referenceSpatialUnitId: '' },
        { hierarchyId: 'h-1', placement: 'above', referenceSpatialUnitId: 'su-3' },
      ]);
    });

    it('seeds nothing for an unassigned dataset', async () => {
      await initWith({ spatialUnitId: 'su-1', spatialUnitLevel: 'Stadt', mandantId: 'm-1' });

      expect(rows().length).toBe(0);
    });

    it('seeds the rows before the hierarchy list has arrived', () => {
      // `ngOnInit` resets the form synchronously while the fetch is still in
      // flight, so the rows have to come off the memberships themselves.
      component.currentSpatialUnitDataset = DATASET_IN_TWO as never;
      component.ngOnInit();

      expect(rows().getRawValue()).toEqual([
        { hierarchyId: 'h-2', placement: 'append', referenceSpatialUnitId: '' },
        { hierarchyId: 'h-1', placement: 'above', referenceSpatialUnitId: 'su-3' },
      ]);
    });

    it('writes nothing when nobody touched the rows', async () => {
      await initWith(DATASET_IN_TWO);

      await save();

      expect(hierarchyApi.updateMemberships).not.toHaveBeenCalled();
    });

    it('keeps the other memberships when one row is removed', async () => {
      await initWith(DATASET_IN_TWO);
      rows().removeAt(0);

      await save();

      // The endpoint replaces the whole list, so dropping one row must not drop
      // the rest with it — which is exactly what the single-select did.
      expect(hierarchyApi.updateMemberships).toHaveBeenCalledWith('su-2', [
        { hierarchyId: 'h-1', hierarchyLevel: 1 },
      ]);
    });

    it('notices a change to a membership that is not the first', async () => {
      await initWith(DATASET_IN_TWO);
      rows().at(1).patchValue({ placement: 'append', referenceSpatialUnitId: '' });

      await save();

      // Moved to the end of h-1: two members left once su-2 is taken out, so
      // the finest place is level 2.
      expect(hierarchyApi.updateMemberships).toHaveBeenCalledWith('su-2', [
        { hierarchyId: 'h-2', hierarchyLevel: 0 },
        { hierarchyId: 'h-1', hierarchyLevel: 2 },
      ]);
    });

    it('appends a newly added hierarchy behind its last level', async () => {
      await initWith({
        spatialUnitId: 'su-1',
        spatialUnitLevel: 'Stadt',
        mandantId: 'm-1',
        hierarchies: [],
      });
      rows().push(
        buildAssignmentRow({ hierarchyId: 'h-2', placement: 'append', referenceSpatialUnitId: '' })
      );

      await save();

      // h-2 holds one member, so the new one lands at level 1.
      expect(hierarchyApi.updateMemberships).toHaveBeenCalledWith('su-1', [
        { hierarchyId: 'h-2', hierarchyLevel: 1 },
      ]);
    });

    it('clears every membership when the last row is gone', async () => {
      await initWith(DATASET_IN_TWO);
      rows().clear();

      await save();

      expect(hierarchyApi.updateMemberships).toHaveBeenCalledWith('su-2', []);
    });
  });

  /**
   * The two calls a save is made of. Never covered before: the metadata PATCH
   * and the memberships PUT are separate requests, and which one ran matters to
   * what the user is told afterwards.
   */
  describe('saving', () => {
    let http: HttpTestingController;

    async function initAndEdit(): Promise<void> {
      component.currentSpatialUnitDataset = DATASET_IN_TWO as never;
      component.ngOnInit();
      await Promise.resolve();
      await Promise.resolve();
      component.metadataForm.patchValue({
        datasource: 'Amt',
        contact: 'wer@example.org',
        note: '',
        lastUpdate: null,
        sridEPSG: 4326,
        literature: '',
      });
      // A change the memberships write has to notice.
      component.editForm.controls.hierarchyAssignments.at(1).patchValue({
        placement: 'append',
        referenceSpatialUnitId: '',
      });
    }

    function answerPatch(): void {
      const request = http.expectOne(
        (candidate) => candidate.method === 'PATCH' && candidate.url.endsWith('/spatial-units/su-2')
      );
      request.flush({});
    }

    beforeEach(() => {
      http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('writes the metadata first and the memberships after it', async () => {
      await initAndEdit();
      const closed = jest.spyOn(TestBed.inject(NgbActiveModal), 'close');
      const refreshed = jest.fn();
      component.refreshRequested.subscribe(refreshed);

      const done = component.editSpatialUnitMetadata();
      answerPatch();
      await done;

      // The order is what the error message below rests on.
      expect(hierarchyApi.updateMemberships).toHaveBeenCalledWith('su-2', [
        { hierarchyId: 'h-2', hierarchyLevel: 0 },
        { hierarchyId: 'h-1', hierarchyLevel: 2 },
      ]);
      expect(refreshed).toHaveBeenCalledTimes(1);
      expect(closed).toHaveBeenCalledWith({ action: 'updated', spatialUnitId: 'su-2' });
    });

    it('stays open and says the metadata is already saved when the memberships fail', async () => {
      await initAndEdit();
      hierarchyApi.updateMemberships.mockRejectedValue(new Error('nope'));
      const notifications = TestBed.inject(NotificationService);
      const closed = jest.spyOn(TestBed.inject(NgbActiveModal), 'close');

      const done = component.editSpatialUnitMetadata();
      answerPatch();
      await done;

      expect((notifications.showError as jest.Mock).mock.calls[0][0]).toContain(
        'HIERARCHY_UPDATE_FAILED'
      );
      expect(closed).not.toHaveBeenCalled();
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
