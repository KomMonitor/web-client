import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import type { TimeseriesMapping } from 'services/resource-import-service/resource-import.model';
import { TimeseriesMappingFormComponent } from './timeseries-mapping-form.component';
import { timeseriesMappingsRequiredValidator } from './timeseries-mapping-form.model';

/**
 * The component is a leaf `ControlValueAccessor`, so this spec renders it and
 * asserts the round trip a host form sees: `writeValue` fills the overview
 * table, adding/deleting an entry pushes a new array out through `onChange`.
 * The mapping rules themselves are covered TestBed-free in
 * `timeseries-mapping-form.model.spec.ts`.
 */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TimeseriesMappingFormComponent],
  template: `<app-timeseries-mapping-form [formControl]="control" />`,
})
class HostComponent {
  readonly control = new FormControl<TimeseriesMapping[]>([], {
    nonNullable: true,
    validators: [timeseriesMappingsRequiredValidator],
  });
}

describe('TimeseriesMappingFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: TimeseriesMappingFormComponent;

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
  const addButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button.btn-success');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('renders an empty-state row while nothing is mapped', () => {
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('EMPTY');
  });

  it('renders the entries written from the host control', () => {
    host.control.setValue([
      { indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' },
      { indicatorValueProperty: 'DATE_2009', timestampProperty: 'year' },
    ]);
    fixture.detectChanges();

    const cells = rows().map((row) =>
      Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent!.trim())
    );

    expect(cells).toHaveLength(2);
    expect(cells[0].slice(1)).toEqual(['DATE_2008', '', '2008-01-01']);
    expect(cells[1].slice(1)).toEqual(['DATE_2009', 'year', '']);
  });

  it('keeps the add button disabled until the draft is complete', () => {
    expect(addButton().disabled).toBe(true);

    component.draft.patchValue({ indicatorValueProperty: 'DATE_2008' });
    fixture.detectChanges();
    expect(addButton().disabled).toBe(true);

    component.draft.patchValue({ timestamp: '2008-01-01' });
    fixture.detectChanges();
    expect(addButton().disabled).toBe(false);
  });

  it('pushes the added entry into the host control and clears the draft', () => {
    component.draft.patchValue({
      indicatorValueProperty: 'DATE_2008',
      timestamp: '2008-01-01',
    });

    component.onClickUpdateMapping();

    expect(host.control.value).toEqual([
      { indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' },
    ]);
    expect(host.control.valid).toBe(true);
    expect(component.draft.getRawValue().indicatorValueProperty).toBe('');
  });

  it('replaces the entry of a re-added attribute instead of appending', () => {
    host.control.setValue([{ indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' }]);
    fixture.detectChanges();

    component.onClickEditEntry(host.control.value[0]);
    component.draft.patchValue({ timestamp: '2008-07-01' });
    component.onClickUpdateMapping();

    expect(host.control.value).toEqual([
      { indicatorValueProperty: 'DATE_2008', timestamp: '2008-07-01' },
    ]);
  });

  it('loads an entry with a time-stamp attribute back with the toggle on', () => {
    component.onClickEditEntry({ indicatorValueProperty: 'value', timestampProperty: 'year' });

    expect(component.draft.getRawValue()).toEqual({
      indicatorValueProperty: 'value',
      useTimestampProperty: true,
      timestampProperty: 'year',
      timestamp: '',
    });
  });

  it('clears the inactive time-stamp source when the toggle flips', () => {
    component.draft.patchValue({ timestamp: '2008-01-01' });

    component.draft.controls.useTimestampProperty.setValue(true);
    component.onChangeUseTimestampProperty();

    expect(component.draft.controls.timestamp.value).toBe('');
  });

  it('removes an entry and reports the empty mapping as invalid again', () => {
    host.control.setValue([{ indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' }]);
    fixture.detectChanges();

    component.onClickDeleteEntry(host.control.value[0]);

    expect(host.control.value).toEqual([]);
    expect(host.control.hasError('timeseriesMappingRequired')).toBe(true);
  });

  it('resets the draft when the host writes a new value', () => {
    component.draft.patchValue({ indicatorValueProperty: 'stale', timestamp: '2008-01-01' });

    host.control.setValue([{ indicatorValueProperty: 'DATE_2009', timestamp: '2009-01-01' }]);

    expect(component.draft.getRawValue().indicatorValueProperty).toBe('');
  });

  it('disables the draft and the row actions when the host control is disabled', () => {
    host.control.setValue([{ indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' }]);
    host.control.disable();
    fixture.detectChanges();

    expect(component.disabled).toBe(true);
    expect(component.draft.disabled).toBe(true);
    const actionButtons: HTMLButtonElement[] = Array.from(rows()[0].querySelectorAll('button'));
    expect(actionButtons.every((button) => button.disabled)).toBe(true);
  });
});
