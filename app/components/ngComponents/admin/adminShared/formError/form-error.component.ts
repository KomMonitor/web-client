import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, switchMap } from 'rxjs';
import { ResolvedFormError, resolveFormError } from './form-error.model';

/**
 * Renders the validation message of a single control (or group, for the
 * cross-field validators). Replaces the empty `<div class="help-block
 * with-errors">` blocks left over from the AngularJS bootstrap-validator setup
 * and the hand-written `@if (xInvalid)` blocks in the admin modals.
 *
 * The control is read through `control.events` rather than a plain `@Input`:
 * a control's object identity never changes, so an OnPush host would never
 * re-render this component when validity or `touched` flips.
 *
 * Usage:
 *   <input formControlName="datasetName" appAria="su-metadata-name" />
 *   <app-form-error [control]="form.controls.datasetName" for="su-metadata-name" />
 */
@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error(); as resolved) {
      <div class="help-block with-errors" [attr.id]="errorId()" role="alert">
        {{ resolved.key | translate: resolved.params }}
      </div>
    }
  `,
})
export class FormErrorComponent {
  /** Control to report on; accepts null so `form.get('x')` can be passed directly. */
  readonly control = input.required<AbstractControl | null | undefined>();

  /** Id of the input this message belongs to; the message gets `<for>-error`. */
  readonly for = input<string>('');

  /**
   * `touched` (default) only shows the message once the user has interacted,
   * matching the existing topic-edit modal. `always` reveals it immediately —
   * for summary-style validation after a submit attempt.
   */
  readonly showWhen = input<'touched' | 'always'>('touched');

  /**
   * Full i18n key that overrides the validator-derived one, so the existing
   * resource-specific messages (e.g. `ADMIN_SPATIAL_UNITS.METADATA_STEP.NAME_INVALID`)
   * can be kept where they read better than the generic wording.
   */
  readonly keyOverride = input<string>('');

  readonly errorId = computed(() => (this.for() ? `${this.for()}-error` : null));

  /** Emits on every status/touched/value event of the current control. */
  private readonly controlEvent = toSignal(
    toObservable(this.control).pipe(switchMap((control) => control?.events ?? EMPTY)),
    { initialValue: null }
  );

  readonly error = computed<ResolvedFormError | null>(() => {
    // Registers this computed as a dependency of the control's event stream.
    this.controlEvent();

    const control = this.control();
    if (!control || !control.invalid) {
      return null;
    }
    if (this.showWhen() === 'touched' && !control.touched && !control.dirty) {
      return null;
    }

    const resolved = resolveFormError(control.errors);
    if (!resolved) {
      return null;
    }

    const override = this.keyOverride();
    return override ? { key: override, params: resolved.params } : resolved;
  });
}
