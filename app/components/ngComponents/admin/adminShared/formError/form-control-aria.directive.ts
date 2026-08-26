import { Directive, HostBinding, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Wires a form control's accessibility attributes to its `<app-form-error>`
 * message, so a field needs the id spelled out only twice instead of three
 * times:
 *
 *   <input formControlName="datasetName" appAria="su-metadata-name" />
 *   <app-form-error [control]="form.controls.datasetName" for="su-metadata-name" />
 *
 * Sets `id` on the host and, while the control is invalid and the user has
 * interacted with it, `aria-invalid` plus `aria-describedby="<id>-error"`.
 */
@Directive({
  selector: '[appAria]',
  standalone: true,
})
export class FormControlAriaDirective {
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  /** Stable field id, e.g. `su-metadata-name`. */
  @Input({ required: true, alias: 'appAria' }) fieldId!: string;

  @HostBinding('attr.id')
  get id(): string {
    return this.fieldId;
  }

  @HostBinding('attr.aria-invalid')
  get ariaInvalid(): string | null {
    return this.showsError ? 'true' : null;
  }

  @HostBinding('attr.aria-describedby')
  get ariaDescribedBy(): string | null {
    return this.showsError ? `${this.fieldId}-error` : null;
  }

  /** Mirrors the `showWhen: 'touched'` default of `<app-form-error>`. */
  private get showsError(): boolean {
    const control = this.ngControl;
    return !!control?.invalid && (!!control.touched || !!control.dirty);
  }
}
