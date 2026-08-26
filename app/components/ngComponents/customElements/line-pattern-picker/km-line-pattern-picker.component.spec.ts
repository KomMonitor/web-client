import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from './km-line-pattern-picker.component';

const OPTIONS: LinePatternOption[] = [
  { label: 'durchgezogen', dashArrayValue: '', svgString: '<svg></svg>' },
  { label: 'gestrichelt', dashArrayValue: '5,5', svgString: '<svg></svg>' },
  { label: 'gepunktet', dashArrayValue: '1,3', svgString: '<svg></svg>' },
];

@Component({
  standalone: true,
  imports: [KmLinePatternPickerComponent],
  template: `<km-line-pattern-picker
    [selectedPattern]="pattern"
    [options]="options"
    (patternChange)="pattern = $event"
  />`,
})
class LegacyHostComponent {
  options = OPTIONS;
  pattern: LinePatternOption | null = OPTIONS[1];
}

@Component({
  standalone: true,
  imports: [KmLinePatternPickerComponent, ReactiveFormsModule],
  template: `<km-line-pattern-picker [formControl]="control" [options]="options" />`,
})
class ReactiveHostComponent {
  options = OPTIONS;
  control = new FormControl<LinePatternOption | null>(OPTIONS[1]);
}

describe('KmLinePatternPickerComponent', () => {
  describe('as an input/output widget', () => {
    let fixture: ComponentFixture<LegacyHostComponent>;
    let host: LegacyHostComponent;
    let picker: KmLinePatternPickerComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [LegacyHostComponent] }).compileComponents();
      fixture = TestBed.createComponent(LegacyHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      picker = fixture.debugElement.children[0].componentInstance;
    });

    it('takes the bound pattern', () => {
      expect(picker.selectedPattern).toBe(OPTIONS[1]);
    });

    it('emits a selection to the host', () => {
      picker.selectPattern(OPTIONS[2]);

      expect(host.pattern).toBe(OPTIONS[2]);
    });
  });

  describe('as a reactive form control', () => {
    let fixture: ComponentFixture<ReactiveHostComponent>;
    let host: ReactiveHostComponent;
    let picker: KmLinePatternPickerComponent;

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
      expect(picker.selectedPattern).toBe(OPTIONS[1]);
    });

    it('writes a selection into the control as the option object', () => {
      picker.selectPattern(OPTIONS[2]);

      expect(host.control.value).toBe(OPTIONS[2]);
      expect(host.control.value!.dashArrayValue).toBe('1,3');
    });

    it('writes null when the selection is cleared', () => {
      picker.clearSelection();

      expect(host.control.value).toBeNull();
    });

    it('resolves a structurally equal value to the matching option instance', () => {
      host.control.setValue({ label: 'x', dashArrayValue: '1,3', svgString: '' });
      fixture.detectChanges();

      expect(picker.selectedPattern).toBe(OPTIONS[2]);
    });

    it('re-resolves once late-arriving options show up', () => {
      host.options = [];
      fixture.detectChanges();

      const imported = { label: 'x', dashArrayValue: '5,5', svgString: '' };
      host.control.setValue(imported);
      fixture.detectChanges();
      expect(picker.selectedPattern).toBe(imported);

      host.options = OPTIONS;
      fixture.detectChanges();

      expect(picker.selectedPattern).toBe(OPTIONS[1]);
    });

    it('keeps an unknown value instead of dropping it', () => {
      const unknown = { label: 'x', dashArrayValue: '9,9', svgString: '' };
      host.control.setValue(unknown);
      fixture.detectChanges();

      expect(picker.selectedPattern).toBe(unknown);
    });

    it('marks the control touched when the dropdown closes', () => {
      picker.toggle();
      picker.close();

      expect(host.control.touched).toBe(true);
    });

    it('honours a disabled control', () => {
      host.control.disable();
      fixture.detectChanges();

      expect(picker.disabled).toBe(true);

      picker.selectPattern(OPTIONS[0]);
      expect(host.control.value).toBe(OPTIONS[1]);
    });
  });
});
