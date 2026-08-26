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
