import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';

/**
 * Registers a new spatial unit level by name. The compact counterpart of the
 * design draft's multi-step register dialog — description, outline flag, tenant
 * and the multi-hierarchy assignment are not part of it yet.
 *
 * Resolves with the entered name, or dismisses on cancel.
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

  /** Names that are already taken; ng-bootstrap sets this via componentInstance. */
  @Input() existingNames: readonly string[] = [];

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, uniqueNameValidator(() => this.existingNames)],
    }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.controls.name.markAsTouched();
      return;
    }
    this.activeModal.close(this.form.controls.name.value.trim());
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
