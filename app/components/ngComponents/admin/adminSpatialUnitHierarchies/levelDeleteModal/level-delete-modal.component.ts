import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { RegisteredLevel } from '../hierarchy.model';

/**
 * Confirmation dialog for deleting one spatial unit level from the registry,
 * shaped like the other admin `*DeleteModal`s. Confirmation-only: the page owns
 * the registry and does the removing, this dialog just reports the decision.
 *
 * Only ever asked for a level no hierarchy uses — the section it is opened from
 * lists nothing else.
 */
@Component({
  selector: 'app-level-delete-modal',
  templateUrl: './level-delete-modal.component.html',
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelDeleteModalComponent {
  private readonly activeModal = inject(NgbActiveModal);

  /** Set by the opener through `AdminModalService`. */
  @Input() level?: RegisteredLevel;

  confirm(): void {
    this.activeModal.close(true);
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
