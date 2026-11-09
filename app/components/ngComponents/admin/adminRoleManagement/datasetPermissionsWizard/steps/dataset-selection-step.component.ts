import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { DatasetPermissionsWizardStateService } from '../dataset-permissions-wizard-state.service';
import { KIND_LABELS } from '../dataset-permissions.labels';
import {
  DATASET_KINDS,
  DatasetKind,
  PermissionDataset,
  datasetKey,
  timeseriesCount,
} from '../dataset-permissions.model';
import { TriStateCheckboxDirective } from '../tri-state-checkbox.directive';

/**
 * Step 1 of the wizard: which of the owner's datasets the rights are
 * transferred to. Everything starts selected; the datasets are grouped by
 * kind, each group collapsed, with a checkbox for the whole group.
 *
 * The selection lives in the wizard's state; only which groups are open is
 * this step's own.
 */
@Component({
  selector: 'app-dataset-selection-step',
  templateUrl: './dataset-selection-step.component.html',
  styleUrls: ['./dataset-selection-step.component.scss'],
  imports: [TranslateModule, TriStateCheckboxDirective],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelectionStepComponent {
  protected readonly state = inject(DatasetPermissionsWizardStateService);

  /** Shown in the intro; the state knows the owner only by id. */
  readonly ownerName = input('');

  protected readonly kinds = DATASET_KINDS;
  protected readonly kindLabels = KIND_LABELS;
  protected readonly datasetKey = datasetKey;
  protected readonly timeseriesCount = timeseriesCount;

  private readonly expanded = signal<ReadonlySet<DatasetKind>>(new Set());

  protected isExpanded(kind: DatasetKind): boolean {
    return this.expanded().has(kind);
  }

  protected toggleExpanded(kind: DatasetKind): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (!next.delete(kind)) {
        next.add(kind);
      }
      return next;
    });
  }

  /** Partly or not selected → select all; all selected → select none. */
  protected toggleKind(kind: DatasetKind): void {
    this.state.setKindSelected(kind, this.state.selectionState(kind) !== 'all');
  }

  protected toggleDataset(dataset: PermissionDataset): void {
    const key = datasetKey(dataset);
    this.state.setSelected(key, !this.state.isSelected(key));
  }

  protected selectedCount(kind: DatasetKind): number {
    return this.state
      .datasetsByKind()
      [kind].filter((dataset) => this.state.isSelected(datasetKey(dataset))).length;
  }
}
