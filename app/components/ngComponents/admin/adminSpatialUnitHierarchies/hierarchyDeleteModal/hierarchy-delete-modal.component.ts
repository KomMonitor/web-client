import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { SpatialUnitHierarchy } from '../hierarchy.model';

/**
 * Confirmation dialog for removing one hierarchy, shaped like the other admin
 * `*DeleteModal`s. Confirmation-only: the page owns the hierarchy list and does
 * the removing, this dialog just reports the decision.
 */
@Component({
  selector: 'app-hierarchy-delete-modal',
  templateUrl: './hierarchy-delete-modal.component.html',
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchyDeleteModalComponent {
  private readonly activeModal = inject(NgbActiveModal);

  /** Set by the opener through `AdminModalService`. */
  @Input() hierarchy?: SpatialUnitHierarchy;

  protected confirm(): void {
    this.activeModal.close(true);
  }

  protected cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
