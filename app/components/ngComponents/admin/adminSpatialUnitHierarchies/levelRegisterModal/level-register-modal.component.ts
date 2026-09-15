import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';

/** What the dialog resolves with. */
export interface LevelRegisterResult {
  readonly name: string;
  /** Where the data comes from; empty when the user left it out. */
  readonly datasource: string;
}

/**
 * Registers a new spatial unit level by name and data source. The compact
 * counterpart of the design draft's multi-step register dialog — description,
 * outline flag, tenant and the multi-hierarchy assignment are not part of it
 * yet; the tenant is the one the page is showing.
 *
 * Resolves with a `LevelRegisterResult`, or dismisses on cancel.
 */
@Component({
  selector: 'app-level-register-modal',
  templateUrl: './level-register-modal.component.html',
  imports: [ReactiveFormsModule, TranslateModule, FormErrorComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelRegisterModalComponent {
  readonly activeModal = inject(NgbActiveModal);

  /** Names that are already taken; set by the opener through `AdminModalService`. */
  @Input() existingNames: readonly string[] = [];

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, uniqueNameValidator(() => this.existingNames)],
    }),
    // Optional: a level registered in a hurry should not be blocked on it.
    datasource: new FormControl('', { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.controls.name.markAsTouched();
      return;
    }
    this.activeModal.close({
      name: this.form.controls.name.value.trim(),
      datasource: this.form.controls.datasource.value.trim(),
    });
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
