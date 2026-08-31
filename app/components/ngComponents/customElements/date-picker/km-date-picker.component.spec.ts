import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { KmDatePickerComponent } from './km-date-picker.component';

/**
 * Covers the two rules that decide whether an open-ended validity period is
 * reachable at all.
 *
 * `validate()` used to treat the empty string as a malformed date: `''` is not
 * null, so it fell through to the ISO format check. The optional "valid until"
 * fields hold `''` while unset, so every open-ended period made its form group
 * invalid — and with the add wizards' submit button bound to `form.invalid`,
 * neither a spatial unit nor a georesource could be created without an end date.
 *
 * `coerceEmptyToToday` is the other half: with it on, clearing the field writes
 * today back on blur, so the period could not be opened up that way either.
 */
describe('KmDatePickerComponent', () => {
  let component: KmDatePickerComponent;
  let fixture: ComponentFixture<KmDatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KmDatePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(KmDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('validate', () => {
    it('accepts an empty optional field', () => {
      component.writeValue('');

      expect(component.validate()).toBeNull();
    });

    it('accepts a null optional field', () => {
      component.writeValue(null);

      expect(component.validate()).toBeNull();
    });

    it('accepts a whitespace-only optional field', () => {
      component.writeValue('   ');

      expect(component.validate()).toBeNull();
    });

    it('still reports an empty required field', () => {
      component.required = true;
      component.writeValue('');

      expect(component.validate()).toEqual({ required: true });
    });

    it('still rejects a malformed date', () => {
      component.writeValue('Unsinn');

      expect(component.validate()).toEqual({ dateFormat: 'Expected YYYY-MM-DD' });
    });

    it('accepts an ISO date', () => {
      component.writeValue('2026-08-31');

      expect(component.validate()).toBeNull();
    });

    it('rejects a date below the minimum', () => {
      component.min = '2026-01-01';
      component.writeValue('2025-12-31');

      expect(component.validate()).toEqual({ minDate: '2026-01-01' });
    });
  });

  // ensureValidOnBlur() defers past ngbDatepicker's own blur handling
  describe('blur handling', () => {
    it('fills an emptied field with today while coerceEmptyToToday is on', fakeAsync(() => {
      component.coerceEmptyToToday = true;
      component.writeValue('');

      component.onBlur();
      tick();

      expect(component.control.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));

    it('leaves an emptied field empty once coerceEmptyToToday is off', fakeAsync(() => {
      component.coerceEmptyToToday = false;
      component.writeValue('');

      component.onBlur();
      tick();

      expect(component.control.value).toBeNull();
    }));

    it('stays empty when the datepicker already parsed the typing to null', fakeAsync(() => {
      component.coerceEmptyToToday = false;
      // An already-null control wins over the leftover raw text: the field is
      // treated as empty, not as a malformed date. (When the datepicker does
      // keep the typed value, the invalid branch below coerces it to today.)
      component.writeValue(null);
      fixture.nativeElement.querySelector('input').value = 'kaputt';

      component.onBlur();
      tick();

      expect(component.control.value).toBeNull();
    }));

    it('still corrects unparseable input to today where the field is coerced', fakeAsync(() => {
      component.coerceEmptyToToday = true;
      component.writeValue(null);
      fixture.nativeElement.querySelector('input').value = 'kaputt';

      component.onBlur();
      tick();

      expect(component.control.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));
  });
});
