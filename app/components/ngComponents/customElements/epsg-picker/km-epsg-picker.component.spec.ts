import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KmEpsgPickerComponent } from './km-epsg-picker.component';

@Component({
  standalone: true,
  imports: [KmEpsgPickerComponent],
  template: `<km-epsg-picker [(code)]="code" />`,
})
class TwoWayHostComponent {
  code: number | null = 25832;
}

@Component({
  standalone: true,
  imports: [KmEpsgPickerComponent, ReactiveFormsModule],
  template: `<km-epsg-picker [formControl]="control" />`,
})
class ReactiveHostComponent {
  control = new FormControl<number | null>(4326);
}

describe('KmEpsgPickerComponent', () => {
  describe('as a [(code)] widget', () => {
    let fixture: ComponentFixture<TwoWayHostComponent>;
    let host: TwoWayHostComponent;
    let picker: KmEpsgPickerComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TwoWayHostComponent] }).compileComponents();
      fixture = TestBed.createComponent(TwoWayHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      picker = fixture.debugElement.children[0].componentInstance;
    });

    it('shows the bound code in the dropdown', () => {
      expect(picker.selectedDropdownValue).toBe(25832);
      expect(picker.isCustomMode).toBe(false);
    });

    it('emits a dropdown selection to the host', () => {
      picker.selectedDropdownValue = 3857;
      picker.onDropdownChange();

      expect(host.code).toBe(3857);
    });

    it('reports null while a custom code is invalid and keeps the typed value', () => {
      picker.selectedDropdownValue = picker.customSentinel;
      picker.onDropdownChange();
      picker.customInputRaw = 1.5;
      picker.onCustomInputChange();
      fixture.detectChanges();

      expect(host.code).toBeNull();
      expect(picker.isCustomMode).toBe(true);
      expect(picker.customInputRaw).toBe(1.5);
      expect(picker.customInputValid).toBe(false);
    });

    it('emits a valid custom code', () => {
      picker.selectedDropdownValue = picker.customSentinel;
      picker.onDropdownChange();
      picker.customInputRaw = 5678;
      picker.onCustomInputChange();

      expect(host.code).toBe(5678);
    });

    it('opens the free-input field for a code that is not in the list', () => {
      host.code = 2056;
      fixture.detectChanges();

      expect(picker.isCustomMode).toBe(true);
      expect(picker.customInputRaw).toBe(2056);
      expect(picker.customInputValid).toBe(true);
    });
  });

  describe('as a reactive form control', () => {
    let fixture: ComponentFixture<ReactiveHostComponent>;
    let host: ReactiveHostComponent;
    let picker: KmEpsgPickerComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ReactiveHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(ReactiveHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      picker = fixture.debugElement.children[0].componentInstance;
    });

    it('takes the control value', () => {
      expect(picker.selectedDropdownValue).toBe(4326);
    });

    it('does not emit on init', () => {
      expect(host.control.dirty).toBe(false);
    });

    it('writes a selection back to the control', () => {
      picker.selectedDropdownValue = 25833;
      picker.onDropdownChange();

      expect(host.control.value).toBe(25833);
    });

    it('follows setValue / reset', () => {
      host.control.setValue(31467);
      expect(picker.selectedDropdownValue).toBe(31467);

      host.control.reset(null);
      expect(picker.selectedDropdownValue).toBeNull();
      expect(picker.isCustomMode).toBe(false);
    });

    it('follows the disabled state', () => {
      host.control.disable();

      expect(picker.disabled).toBe(true);
    });
  });
});
