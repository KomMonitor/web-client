import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { SpatialUnitHierarchyOverviewType } from 'models/data-management-api';

import { HierarchyAssignmentPanelComponent } from './hierarchy-assignment-panel.component';
import {
  HierarchyAssignmentRowGroup,
  buildAssignmentRow,
  buildHierarchyAssignmentArray,
} from './hierarchy-assignment.model';

/**
 * The panel as it renders and mutates its rows. What the rows *mean* is tested
 * in `hierarchy-assignment.model.spec` — pure functions, no fixture — and what
 * each dialog does with them in that dialog's own spec.
 */

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

describe('HierarchyAssignmentPanelComponent', () => {
  let fixture: ComponentFixture<HierarchyAssignmentPanelComponent>;
  let rows: FormArray<HierarchyAssignmentRowGroup>;

  function render(mandantId = 'm-essen'): void {
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('hierarchies', HIERARCHIES);
    fixture.componentRef.setInput('mandantId', mandantId);
    fixture.detectChanges();
  }

  /** The ids the hierarchy select of the row at `rowIndex` offers. */
  function hierarchyOptions(rowIndex: number): string[] {
    return optionsOf(rowIndex, 0);
  }

  function optionsOf(rowIndex: number, selectIndex: number): string[] {
    return fixture.debugElement
      .queryAll(By.css('.assignment-row'))
      [rowIndex].queryAll(By.css('select'))
      [selectIndex].queryAll(By.css('option'))
      .map((option) => option.nativeElement.value)
      .filter((value: string) => value !== '');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HierarchyAssignmentPanelComponent, TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(HierarchyAssignmentPanelComponent);
    rows = buildHierarchyAssignmentArray();
  });

  it('offers the chosen tenant and the ones no tenant claims', () => {
    rows.push(buildAssignmentRow());
    render();

    expect(hierarchyOptions(0)).toEqual(['h-essen', 'h-unknown']);
  });

  it('follows a tenant switch', () => {
    rows.push(buildAssignmentRow());
    render();

    fixture.componentRef.setInput('mandantId', 'm-bochum');
    fixture.detectChanges();

    expect(hierarchyOptions(0)).toEqual(['h-bochum', 'h-unknown']);
  });

  it('offers every hierarchy where no tenant narrows the choice', () => {
    rows.push(buildAssignmentRow());
    render('');

    expect(hierarchyOptions(0)).toEqual(['h-essen', 'h-bochum', 'h-unknown']);
  });

  it('shows a row the host pushed, not only its own', () => {
    render();
    expect(fixture.debugElement.queryAll(By.css('.assignment-row'))).toHaveLength(0);

    rows.push(buildAssignmentRow());
    fixture.detectChanges();

    // Nothing about the input changed — the array is the same object — so this
    // only renders because the panel listens to the array itself.
    expect(fixture.debugElement.queryAll(By.css('.assignment-row'))).toHaveLength(1);
  });

  it('adds and removes rows', () => {
    render();

    fixture.debugElement.query(By.css('.assignment-add .btn')).nativeElement.click();
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.assignment-row'))).toHaveLength(1);

    fixture.debugElement.query(By.css('.assignment-remove')).nativeElement.click();
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.assignment-row'))).toHaveLength(0);
    expect(rows.length).toBe(0);
  });

  it('rests the add button while there is no hierarchy to assign', () => {
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('hierarchies', []);
    fixture.componentRef.setInput('mandantId', 'm-essen');
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.assignment-add .btn'));
    expect(button.nativeElement.disabled).toBe(true);
    expect(
      fixture.debugElement.query(By.css('.assignment-add .assignment-hint')).nativeElement
        .textContent
    ).toContain('NO_HIERARCHIES');
  });

  it('asks for a reference level only where the placement needs one', () => {
    rows.push(buildAssignmentRow({ hierarchyId: 'h-essen' }));
    render();

    // Appending needs no reference, so the column says so instead of offering
    // a select nobody has to fill.
    expect(fixture.debugElement.query(By.css('.assignment-muted'))).not.toBeNull();

    rows.at(0).controls.placement.setValue('above');
    fixture.detectChanges();

    const selects = fixture.debugElement.queryAll(By.css('.assignment-row select'));
    expect(selects).toHaveLength(3);
    // Coarsest first, whatever order the API answered in.
    expect(optionsOf(0, 2)).toEqual(['su-city', 'su-district']);
  });

  it('starts a row over when its hierarchy changes', () => {
    rows.push(
      buildAssignmentRow({
        hierarchyId: 'h-essen',
        placement: 'above',
        referenceSpatialUnitId: 'su-city',
      })
    );
    render();

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

  it('names the tenant everything below belongs to, and stays quiet without one', () => {
    rows.push(buildAssignmentRow());
    render();
    expect(fixture.debugElement.query(By.css('.assignment-scope'))).toBeNull();

    fixture.componentRef.setInput('mandantName', 'Stadt Essen');
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.assignment-scope')).nativeElement.textContent.trim()
    ).toBe('ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT.MANDANT_SCOPE_INFO');
  });

  it('says when a hierarchy was assigned twice', () => {
    rows.push(buildAssignmentRow({ hierarchyId: 'h-essen' }));
    rows.push(buildAssignmentRow({ hierarchyId: 'h-essen' }));
    render();

    // The endpoints replace the whole membership list, so a second row for the
    // same hierarchy could only contradict the first.
    expect(
      fixture.debugElement.query(By.css('.assignment-rows > .assignment-error'))
    ).not.toBeNull();
  });
});
