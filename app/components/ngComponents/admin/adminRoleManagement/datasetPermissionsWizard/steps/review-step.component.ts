import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { DatasetPermissionsWizardStateService } from '../dataset-permissions-wizard-state.service';
import { RightLevel, SummaryLine } from '../dataset-permissions.model';

/** The levels as they read inside a sentence, which in English differs from the column heads. */
const LEVEL_LABELS: Record<RightLevel, string> = {
  viewer: 'ADMIN_DATASET_PERMISSIONS.REVIEW.LEVELS.VIEWER',
  editor: 'ADMIN_DATASET_PERMISSIONS.REVIEW.LEVELS.EDITOR',
};

/**
 * Step 3 of the wizard: what the transfer will do, before it is sent — per
 * group and right, on how many datasets it is gained or lost, and on how many
 * datasets anything changes at all.
 *
 * Only shows what the wizard's state derives; sending is the dialog's.
 */
@Component({
  selector: 'app-review-step',
  templateUrl: './review-step.component.html',
  styleUrls: ['./review-step.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStepComponent {
  protected readonly state = inject(DatasetPermissionsWizardStateService);

  /** Named in the notice; the state knows the owner only by id. */
  readonly ownerName = input('');

  protected readonly levelLabels = LEVEL_LABELS;

  /** Translation key of a summary line's text, in singular or plural. */
  protected lineKey(line: SummaryLine): string {
    const verb = line.change === 'add' ? 'GAINS' : 'LOSES';
    return `ADMIN_DATASET_PERMISSIONS.REVIEW.${verb}_${line.count === 1 ? 'ONE' : 'MANY'}`;
  }
}
