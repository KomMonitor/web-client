import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KM_COLOR_PICKER_DEFAULT, KmColorPickerComponent } from './km-color-picker.component';

/**
 * The picker has to serve both worlds: the legacy `[(color)]` call sites in the
 * edit-metadata modals and `formControlName` in the reactive add wizards.
 * The colour popover itself is ngx-color's, so the picks are driven through the
 * component's own event handlers rather than through its markup.
 */

@Component({
  standalone: true,
  imports: [KmColorPickerComponent],
  template: `<km-color-picker [(color)]="color" />`,
})
class LegacyHostComponent {
  color = '#111111';
}

@Component({
  standalone: true,
  imports: [KmColorPickerComponent, ReactiveFormsModule],
  template: `<km-color-picker [formControl]="control" />`,
})
class ReactiveHostComponent {
  control = new FormControl<string>('#111111', { nonNullable: true });
}

const pick = (picker: KmColorPickerComponent, hex: string): void =>
  picker.onChangeComplete({ color: { hex } });

describe('KmColorPickerComponent', () => {
  describe('as a two-way bound widget', () => {
    let fixture: ComponentFixture<LegacyHostComponent>;
    let host: LegacyHostComponent;
    let picker: KmColorPickerComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [LegacyHostComponent] }).compileComponents();
      fixture = TestBed.createComponent(LegacyHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      picker = fixture.debugElement.children[0].componentInstance;
    });

    it('takes the bound colour', () => {
      expect(picker.color).toBe('#111111');
    });

    it('writes a pick back to the host', () => {
      pick(picker, '#abcdef');
      fixture.detectChanges();

      expect(host.color).toBe('#abcdef');
    });
  });

  describe('as a reactive form control', () => {
    let fixture: ComponentFixture<ReactiveHostComponent>;
    let host: ReactiveHostComponent;
    let picker: KmColorPickerComponent;

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
      expect(picker.color).toBe('#111111');
    });

    it('follows a programmatic setValue', () => {
      host.control.setValue('#222222');
      fixture.detectChanges();

      expect(picker.color).toBe('#222222');
    });

    it('falls back to the default colour for a null value', () => {
      host.control.reset(null as any);
      fixture.detectChanges();

      expect(picker.color).toBe(KM_COLOR_PICKER_DEFAULT);
    });

    it('writes a pick into the control', () => {
      pick(picker, '#abcdef');

      expect(host.control.value).toBe('#abcdef');
    });

    it('marks the control touched when the popover closes', () => {
      picker.toggle();
      picker.close();

      expect(host.control.touched).toBe(true);
    });

    it('does not mark the control touched without an interaction', () => {
      picker.close();

      expect(host.control.touched).toBe(false);
    });

    it('honours a disabled control', () => {
      host.control.disable();
      fixture.detectChanges();

      expect(picker.disabled).toBe(true);

      picker.toggle();
      expect(picker.isOpen).toBe(false);
    });
  });
});
