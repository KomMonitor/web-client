import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import type {
  BatchResourceType,
  BatchUpdateRowResult,
} from 'services/batch-update-service/batch-update.model';
import { summariseBatchResults } from 'services/batch-update-service/batch-update.model';

/**
 * Per-row result of a batch update: which datasets went through, which failed
 * and why. Resource-agnostic, so the georesource batch update can reuse it if it
 * is ever brought back — the shared building block `d9875a2a` asked for when it
 * removed the georesource twin.
 *
 * Angular port of the AngularJS `batchUpdateResultModal`, with two deliberate
 * differences: the table is rendered with `@for` instead of being assembled
 * through `document.createElement`, and the error detail sits in a native
 * `<details>` block rather than a jQuery `data-toggle="collapse"` pair. Server
 * strings are interpolated as **text** — the original assigned them to
 * `innerHTML`.
 */
@Component({
  selector: 'app-batch-update-result-modal',
  templateUrl: './batch-update-result-modal.component.html',
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchUpdateResultModalComponent {
  readonly activeModal = inject(NgbActiveModal);

  /**
   * Drives the label of the first column. Both inputs write into signals so the
   * computeds below react to them; a plain field would be read once and cached.
   */
  @Input()
  set resourceType(value: BatchResourceType) {
    this.resourceTypeSignal.set(value);
  }

  @Input()
  set results(value: readonly BatchUpdateRowResult[] | null | undefined) {
    this.rows.set(value ? [...value] : []);
  }

  private readonly resourceTypeSignal = signal<BatchResourceType>('indicator');
  readonly rows = signal<BatchUpdateRowResult[]>([]);

  readonly summary = computed(() => summariseBatchResults(this.rows()));

  /**
   * True while the run was partially applied. Worth saying out loud: rows are
   * committed one by one and there is no rollback, so a failed row leaves the
   * successful ones in place.
   */
  readonly partiallyApplied = computed(
    () => this.summary().success > 0 && this.summary().error > 0
  );

  readonly resourceLabelKey = computed(() =>
    this.resourceTypeSignal() === 'georesource'
      ? 'ADMIN_SHARED_UI.BATCH_UPDATE.RESOURCE_GEORESOURCE'
      : 'ADMIN_SHARED_UI.BATCH_UPDATE.RESOURCE_INDICATOR'
  );
}
