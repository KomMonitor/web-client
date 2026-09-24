import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';

/** What the dialog resolves with — the two things it may change. */
export interface HierarchyEditModalResult {
  readonly name: string;
  readonly isPublic: boolean;
}

/**
 * Edits the metadata of an existing hierarchy: its name and whether it is
 * public. Nothing else about a hierarchy can be edited here —
 *
 * - the **tenant** is immutable, the API refuses to move a hierarchy ("The
 *   mandant of a spatial unit hierarchy cannot be changed"),
 * - the **chain** is edited in the tree on the page, one request per step, so
 *   a second place to change it would only be a copy that goes stale.
 *
 * Both are still shown, because they are what tells the user which hierarchy
 * this is — read-only, in a panel that says so. Creating is a separate dialog
 * (`HierarchyCreateModalComponent`): it assembles the chain, which is exactly
 * what this one does not do.
 *
 * Resolves with the entered values, or dismisses on cancel.
 */
@Component({
  selector: 'app-hierarchy-edit-modal',
  templateUrl: './hierarchy-edit-modal.component.html',
  styleUrls: ['./hierarchy-edit-modal.component.scss'],
  imports: [ReactiveFormsModule, TranslateModule, FormErrorComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchyEditModalComponent implements OnInit {
  private readonly activeModal = inject(NgbActiveModal);

  /** ng-bootstrap sets these via componentInstance, before the first render. */
  @Input() existingNames: readonly string[] = [];
  /** The name to edit; also the one the uniqueness check ignores. */
  @Input() currentName = '';
  @Input() currentIsPublic = false;
  /** Shown as a fact: the tenant this hierarchy belongs to, by name. */
  @Input() mandant = '';
  /** The chain as level names, coarsest first. Shown, not edited. */
  @Input() chain: readonly string[] = [];
  /** The hierarchy's id, so a support question can name it. */
  @Input() hierarchyId = '';

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        uniqueNameValidator(() => this.existingNames, { ignore: () => this.currentName }),
      ],
    }),
    isPublic: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.form.controls.name.setValue(this.currentName);
    this.form.controls.isPublic.setValue(this.currentIsPublic);
  }

  /** The chain on one line, coarse to fine — the order is the whole message. */
  protected get chainText(): string {
    return this.chain.join(' → ');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.controls.name.markAsTouched();
      return;
    }

    const result: HierarchyEditModalResult = {
      name: this.form.controls.name.value.trim(),
      isPublic: this.form.controls.isPublic.value,
    };
    this.activeModal.close(result);
  }

  protected cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
