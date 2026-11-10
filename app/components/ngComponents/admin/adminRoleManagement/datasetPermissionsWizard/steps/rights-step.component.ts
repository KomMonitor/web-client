import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AdminModalService } from 'components/ngComponents/admin/adminShared/modal/admin-modal.service';
import { MODAL_LARGE } from 'util/modal-presets';

import {
  DatasetPermissionsWizardStateService,
  SelectableAction,
} from '../dataset-permissions-wizard-state.service';
import {
  GroupPermissionIds,
  RIGHT_LEVELS,
  RightAction,
  RightLevel,
  RightsDraft,
} from '../dataset-permissions.model';
import { GroupDatasetPermissionsModalComponent } from '../group-dataset-permissions-modal.component';

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
 * this step only shows them. A group's name opens its rights per dataset,
 * whose result comes back here as the dropdown values.
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
  private readonly modals = inject(AdminModalService);

  /** Shown when the tenant has no other groups; the state knows the owner only by id. */
  readonly ownerName = input('');

  protected readonly levels = RIGHT_LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly actionLabels = ACTION_LABELS;

  protected hasAddedSinceDialog(): boolean {
    return Object.keys(this.state.addedSinceDialog()).length > 0;
  }

  /**
   * What a level of the group's decision does on datasets its per-dataset
   * dialog did not show: grant and revoke reach them, keep and custom leave
   * them as they are (see `addedSinceDialog`).
   */
  protected effectOnAdded(groupId: string, level: RightLevel): string {
    const action = this.actionOf(groupId, level);
    const effect = action === 'grant' ? 'GRANT' : action === 'revoke' ? 'REVOKE' : 'KEEP';
    return `ADMIN_DATASET_PERMISSIONS.RIGHTS.ADDED_EFFECT.${effect}`;
  }

  protected actionOf(groupId: string, level: RightLevel): RightAction {
    return this.state.decisions()[groupId]?.[level] ?? 'keep';
  }

  protected onActionChange(groupId: string, level: RightLevel, event: Event): void {
    const action = (event.target as HTMLSelectElement).value as SelectableAction;
    this.state.setAction(groupId, level, action);
  }

  /** Opens the per-dataset rights of the group; a cancelled dialog changes nothing. */
  protected async openGroup(group: GroupPermissionIds): Promise<void> {
    const id = group.organizationalUnitId;
    const draft = await this.modals.open<GroupDatasetPermissionsModalComponent, RightsDraft>(
      GroupDatasetPermissionsModalComponent,
      MODAL_LARGE,
      {
        group,
        datasets: this.state.selectedDatasets(),
        initialDraft: this.state.draftFor(id),
      }
    );
    if (draft) {
      this.state.applyDraft(id, draft);
    }
  }
}
