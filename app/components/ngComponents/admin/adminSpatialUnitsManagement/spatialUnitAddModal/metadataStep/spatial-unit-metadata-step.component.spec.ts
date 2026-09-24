import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { SpatialUnitHierarchyOverviewType } from 'models/data-management-api';
import { MandantService } from 'services/mandant-service/mandant.service';

import { HierarchyAssignmentPanelComponent } from '../../hierarchyAssignment/hierarchy-assignment-panel.component';
import { buildAssignmentRow } from '../../hierarchyAssignment/hierarchy-assignment.model';
import {
  SpatialUnitMetadataStepGroup,
  buildSpatialUnitAddForm,
} from '../spatial-unit-add-form.model';
import { SpatialUnitMetadataStepComponent } from './spatial-unit-metadata-step.component';

const HIERARCHIES: SpatialUnitHierarchyOverviewType[] = [
  {
    hierarchyId: 'h-essen',
    name: 'Verwaltungsgliederung',
    mandantId: 'm-essen',
    isPublic: false,
    members: [
      { spatialUnitId: 'su-district', spatialUnitLevel: 'Stadtteile', hierarchyLevel: 1 },
      { spatialUnitId: 'su-city', spatialUnitLevel: 'Stadt Essen', hierarchyLevel: 0 },
    ],
  },
  {
    hierarchyId: 'h-bochum',
    name: 'Verwaltungsgliederung Bochum',
    mandantId: 'm-bochum',
    isPublic: false,
    members: [],
  },
  // No tenant at all: an older deployment answers like this, and "unknown" is
  // not the same as "belongs to someone else".
  { hierarchyId: 'h-unknown', name: 'Ohne Mandant', isPublic: false, members: [] },
];

const MANDANTS = [
  { id: 'm-essen', name: 'Stadt Essen' },
  { id: 'm-bochum', name: 'Stadt Bochum' },
];

describe('SpatialUnitMetadataStepComponent', () => {
  let fixture: ComponentFixture<SpatialUnitMetadataStepComponent>;
  let component: SpatialUnitMetadataStepComponent;
  let group: SpatialUnitMetadataStepGroup;

  function configure(mandants: typeof MANDANTS, isRealmAdmin = true): void {
    TestBed.configureTestingModule({
      imports: [
        SpatialUnitMetadataStepComponent,
        HierarchyAssignmentPanelComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        {
          provide: MandantService,
          useValue: {
            mandantRefs: mandants,
            isRealmAdmin,
            mandantNameOf: (id: string) => mandants.find((entry) => entry.id === id)?.name ?? '',
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    group = buildSpatialUnitAddForm({ withSecurity: true, existingLevelNames: () => [] }).controls
      .metadata;
    fixture = TestBed.createComponent(SpatialUnitMetadataStepComponent);
    component = fixture.componentInstance;
  }

  function render(mandantId = 'm-essen'): void {
    group.controls.mandantId.setValue(mandantId);
    fixture.componentRef.setInput('group', group);
    fixture.componentRef.setInput('hierarchies', HIERARCHIES);
    fixture.detectChanges();
  }

  /** The ids the hierarchy select of the row at `rowIndex` offers. */
  function hierarchyOptions(rowIndex: number): string[] {
    return fixture.debugElement
      .queryAll(By.css('.assignment-row'))
      [rowIndex].queryAll(By.css('select'))[0]
      .queryAll(By.css('option'))
      .map((option) => option.nativeElement.value)
      .filter((value: string) => value !== '');
  }

  describe('with tenants', () => {
    beforeEach(() => configure(MANDANTS));

    it('lets an administrator pick the tenant', () => {
      render();

      const field = fixture.debugElement.query(By.css('#su-metadata-mandant'));
      expect(field.nativeElement.tagName).toBe('SELECT');
    });

    it('only shows the tenant where the caller fixed it', () => {
      fixture.componentRef.setInput('mandantLocked', true);
      render();

      // Opened out of a tenant's view: moving the level elsewhere would take it
      // out of the view it was started in.
      const field = fixture.debugElement.query(By.css('#su-metadata-mandant'));
      expect(field.nativeElement.tagName).toBe('INPUT');
      expect(field.nativeElement.disabled).toBe(true);
      expect(field.nativeElement.value).toBe('Stadt Essen');
    });

    // The panel renders the rows and is tested on its own. What belongs here is
    // that it is bound to this step's array and follows this step's tenant —
    // everything the extraction could have broken without a compiler error.
    it('hands its rows and its tenant to the assignment panel', () => {
      render();
      component.group.controls.hierarchyAssignments.push(buildAssignmentRow());
      fixture.detectChanges();

      expect(hierarchyOptions(0)).toEqual(['h-essen', 'h-unknown']);

      group.controls.mandantId.setValue('m-bochum');
      fixture.detectChanges();

      expect(hierarchyOptions(0)).toEqual(['h-bochum', 'h-unknown']);
    });
  });

  describe('without tenants', () => {
    beforeEach(() => configure([], false));

    it('shows a placeholder instead of a choice, and offers every hierarchy', () => {
      render('');
      group.controls.hierarchyAssignments.push(buildAssignmentRow());
      fixture.detectChanges();

      const field = fixture.debugElement.query(By.css('#su-metadata-mandant'));
      expect(field.nativeElement.tagName).toBe('INPUT');
      expect(field.nativeElement.disabled).toBe(true);
      expect(hierarchyOptions(0)).toEqual(['h-essen', 'h-bochum', 'h-unknown']);
    });
  });
});
