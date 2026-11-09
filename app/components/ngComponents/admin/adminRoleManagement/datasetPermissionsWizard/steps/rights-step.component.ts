import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import {
  DatasetPermissionsWizardStateService,
  SelectableAction,
} from '../dataset-permissions-wizard-state.service';
import { RIGHT_LEVELS, RightAction, RightLevel } from '../dataset-permissions.model';

const LEVEL_LABELS: Record<RightLevel, string> = {
  viewer: 'ADMIN_DATASET_PERMISSIONS.LEVELS.VIEWER',
  editor: 'ADMIN_DATASET_PERMISSIONS.LEVELS.EDITOR',
};

const ACTION_LABELS: Record<RightAction, string> = {
  keep: 'ADMIN_DATASET_PERMISSIONS.RIGHTS.ACTIONS.KEEP',
  grant: 'ADMIN_DATASET_PERMISSIONS.RIGHTS.ACTIONS.GRANT',
  revoke: 'ADMIN_DATASET_PERMISSIONS.RIGHTS.ACTIONS.REVOKE',
  custom: 'ADMIN_DATASET_PERMISSIONS.RIGHTS.ACTIONS.CUSTOM',
};

/**
 * Step 2 of the wizard: per group and right, what happens on the selected
 * datasets — keep, grant or revoke. Next to each dropdown, on how many of them
 * the group has the right now, and after the transfer once that differs.
 *
 * The decisions and the coupling of the two rights live in the wizard's state;
 * this step only shows them.
 */
@Component({
  selector: 'app-rights-step',
  templateUrl: './rights-step.component.html',
  styleUrls: ['./rights-step.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RightsStepComponent {
  protected readonly state = inject(DatasetPermissionsWizardStateService);

  /** Shown when the tenant has no other groups; the state knows the owner only by id. */
  readonly ownerName = input('');

  protected readonly levels = RIGHT_LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly actionLabels = ACTION_LABELS;

  protected actionOf(groupId: string, level: RightLevel): RightAction {
    return this.state.decisions()[groupId]?.[level] ?? 'keep';
  }

  protected onActionChange(groupId: string, level: RightLevel, event: Event): void {
    const action = (event.target as HTMLSelectElement).value as SelectableAction;
    this.state.setAction(groupId, level, action);
  }
}
