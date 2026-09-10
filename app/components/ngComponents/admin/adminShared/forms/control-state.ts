import { Injector, Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

/**
 * Signal mirroring a control's `invalid` state.
 *
 * A `FormGroup` is not reactive in the signal sense, so an OnPush host would
 * never re-render when a step becomes invalid. Reading this signal from the
 * template (directly, or indirectly through `WizardStepper.steps`) registers
 * the host's template effect as a dependency of the control's event stream.
 *
 * Must be called in an injection context (field initializer or constructor)
 * unless an explicit `injector` is passed.
 */
export function controlInvalidSignal(
  control: AbstractControl,
  options: { whenTouched?: boolean; injector?: Injector } = {}
): Signal<boolean> {
  const event = toSignal(control.events, { initialValue: null, injector: options.injector });

  return computed(() => {
    // Registers the dependency; the event value itself is not needed.
    event();
    return options.whenTouched ? control.invalid && control.touched : control.invalid;
  });
}

/**
 * Signal mirroring an arbitrary derived read of a control, recomputed on every
 * control event (value, status, pristine, touched, reset).
 *
 * Use it where an OnPush template needs a control's *value* — or one specific
 * error — instead of its overall validity. A plain `control.value` read in a
 * template is not reactive: user input re-renders the view only because the
 * event handler that caused it lives in the same view, so an asynchronous
 * `setValue` (a metadata file import, say) would leave the view stale.
 *
 * Must be called in an injection context (field initializer or constructor)
 * unless an explicit `injector` is passed.
 */
export function controlStateSignal<T>(
  control: AbstractControl,
  read: () => T,
  options: { injector?: Injector } = {}
): Signal<T> {
  const event = toSignal(control.events, { initialValue: null, injector: options.injector });

  return computed(() => {
    // Registers the dependency; the event value itself is not needed.
    event();
    return read();
  });
}
