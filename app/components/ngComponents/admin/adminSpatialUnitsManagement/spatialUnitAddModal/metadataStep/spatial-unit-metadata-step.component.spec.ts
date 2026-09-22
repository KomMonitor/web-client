import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { SpatialUnitHierarchyOverviewType } from 'models/data-management-api';
import { MandantService } from 'services/mandant-service/mandant.service';

import { buildAssignmentRow } from '../hierarchy-assignment.model';
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
      imports: [SpatialUnitMetadataStepComponent, TranslateModule.forRoot()],
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

    it('offers the chosen tenant and the ones no tenant claims', () => {
      render();
      component.group.controls.hierarchyAssignments.push(buildAssignmentRow());
      fixture.detectChanges();

      expect(hierarchyOptions(0)).toEqual(['h-essen', 'h-unknown']);
    });

    it('follows a tenant switch', () => {
      render();
      component.group.controls.hierarchyAssignments.push(buildAssignmentRow());
      fixture.detectChanges();

      group.controls.mandantId.setValue('m-bochum');
      fixture.detectChanges();

      expect(hierarchyOptions(0)).toEqual(['h-bochum', 'h-unknown']);
    });

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

    it('adds and removes rows', () => {
      render();

      fixture.debugElement.query(By.css('.assignment-add .btn')).nativeElement.click();
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.assignment-row'))).toHaveLength(1);

      fixture.debugElement.query(By.css('.assignment-remove')).nativeElement.click();
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.assignment-row'))).toHaveLength(0);
      expect(group.controls.hierarchyAssignments.length).toBe(0);
    });

    it('asks for a reference level only where the placement needs one', () => {
      render();
      const rows = group.controls.hierarchyAssignments;
      rows.push(buildAssignmentRow({ hierarchyId: 'h-essen' }));
      fixture.detectChanges();

      // Appending needs no reference, so the column says so instead of offering
      // a select nobody has to fill.
      expect(fixture.debugElement.query(By.css('.assignment-muted'))).not.toBeNull();

      rows.at(0).controls.placement.setValue('above');
      fixture.detectChanges();

      const selects = fixture.debugElement.queryAll(By.css('.assignment-row select'));
      expect(selects).toHaveLength(3);
      expect(
        selects[2]
          .queryAll(By.css('option'))
          .map((option) => option.nativeElement.value)
          .filter((value: string) => value !== '')
        // Coarsest first, whatever order the API answered in.
      ).toEqual(['su-city', 'su-district']);
    });

    it('starts a row over when its hierarchy changes', () => {
      render();
      const rows = group.controls.hierarchyAssignments;
      rows.push(
        buildAssignmentRow({
          hierarchyId: 'h-essen',
          placement: 'above',
          referenceSpatialUnitId: 'su-city',
        })
      );
      fixture.detectChanges();

      const select = fixture.debugElement.queryAll(By.css('.assignment-row select'))[0];
      select.nativeElement.value = 'h-unknown';
      select.nativeElement.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      // A reference of the hierarchy left behind would be sent as a neighbour
      // that is not in the new chain.
      expect(rows.at(0).getRawValue()).toMatchObject({
        placement: 'append',
        referenceSpatialUnitId: '',
      });
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
