import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { GlobalFilterEntry } from 'components/ngComponents/models/globalFilters.models';

/**
 * Confirmation dialog for removing one global filter.
 *
 * Replaces a native `confirm()` in the overview component — the only admin
 * overview grid whose delete button used one, while the other seven areas all
 * have a `*DeleteModal` opened with `MODAL_CONFIRM`.
 *
 * Deliberately confirmation-only: the filters live in a single configuration
 * array that the overview component owns and rewrites as a whole, so this
 * dialog reports the decision and lets that component do the deleting, rather
 * than duplicating the fetch/POST round-trip the other delete modals need.
 */
@Component({
  selector: 'app-admin-filter-delete-modal',
  templateUrl: './admin-filter-delete-modal.component.html',
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFilterDeleteModalComponent {
  private activeModal = inject(NgbActiveModal);

  /** The entry as stored in the configuration; supplies the summary counts. */
  @Input() filter?: GlobalFilterEntry;

  get filterName(): string {
    return (this.filter as any)?.name ?? '';
  }

  get indicatorCount(): number {
    return (this.filter as any)?.indicators?.length ?? 0;
  }

  get indicatorTopicCount(): number {
    return (this.filter as any)?.indicatorTopics?.length ?? 0;
  }

  get georesourceCount(): number {
    return (this.filter as any)?.georesources?.length ?? 0;
  }

  get georesourceTopicCount(): number {
    return (this.filter as any)?.georesourceTopics?.length ?? 0;
  }

  confirm(): void {
    this.activeModal.close(true);
  }

  close(): void {
    this.activeModal.dismiss('cancel');
  }
}
