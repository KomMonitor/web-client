import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { controlInvalidSignal } from './control-state';

/**
 * `toSignal` needs an injection context, so this is the one model-layer spec
 * that touches TestBed — it still has no component and no fixture.
 */
describe('controlInvalidSignal', () => {
  const inContext = <T>(fn: () => T): T => TestBed.runInInjectionContext(fn);

  it('mirrors the current validity', () => {
    const control = new FormControl('', Validators.required);
    const invalid = inContext(() => controlInvalidSignal(control));

    expect(invalid()).toBe(true);
  });

  it('follows a value change', () => {
    const control = new FormControl('', Validators.required);
    const invalid = inContext(() => controlInvalidSignal(control));

    control.setValue('Quartiere');

    expect(invalid()).toBe(false);
  });

  it('follows a group-level validator', () => {
    const group = new FormGroup({
      a: new FormControl('', Validators.required),
      b: new FormControl(''),
    });
    const invalid = inContext(() => controlInvalidSignal(group));
    expect(invalid()).toBe(true);

    group.controls.a.setValue('x');

    expect(invalid()).toBe(false);
  });

  it('stays false until touched with whenTouched', () => {
    const control = new FormControl('', Validators.required);
    const invalid = inContext(() => controlInvalidSignal(control, { whenTouched: true }));
    expect(invalid()).toBe(false);

    control.markAsTouched();

    expect(invalid()).toBe(true);
  });
});
