import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

export interface RoleActionsCellRendererParams extends ICellRendererParams<AccessControlMetadata> {
  onEditMetadata: (dataset: AccessControlMetadata) => void;
  onEditGroupRights: (dataset: AccessControlMetadata) => void;
  onDelete: (dataset: AccessControlMetadata) => void;
  onEditDatasetPermissions: (dataset: AccessControlMetadata) => void;
  /**
   * Whether the user may manage this group. Editing it, delegating its rights
   * and deleting it are one rule in the API, so one answer gates all three.
   */
  canManage: (dataset: AccessControlMetadata) => boolean;
  /**
   * Whether the user may transfer rights on this group's datasets. A separate
   * rule from `canManage`, and the button is left out rather than disabled
   * where it is false: only global admins are meant to see it at all.
   */
  canEditDatasetPermissions: (dataset: AccessControlMetadata) => boolean;
}

@Component({
  selector: 'app-role-actions-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @let forbiddenTitle =
      manageAllowed()
        ? ''
        : ('ADMIN_ROLES.GRID.FORBIDDEN_TITLE' | translate: { group: groupName() });
    <div class="btn-group btn-group-sm">
      <button
        class="btn btn-warning btn-sm"
        type="button"
        [title]="forbiddenTitle || ('ADMIN_SHARED_UI.GRID.EDIT_METADATA_TITLE' | translate)"
        [disabled]="!manageAllowed()"
        (click)="onEditMetadata()"
      >
        <i class="fas fa-pencil-alt"></i>
      </button>
      <button
        class="btn btn-warning btn-sm"
        type="button"
        [title]="forbiddenTitle || ('ADMIN_ROLES.GRID.EDIT_GROUP_RIGHTS_TITLE' | translate)"
        [disabled]="!manageAllowed()"
        (click)="onEditGroupRights()"
      >
        <i class="fas fa-user-lock"></i>
      </button>
      @if (datasetPermissionsAllowed()) {
        <button
          class="btn btn-warning btn-sm"
          type="button"
          [title]="'ADMIN_DATASET_PERMISSIONS.BUTTON_TITLE' | translate"
          (click)="onEditDatasetPermissions()"
        >
          <i class="fas fa-database"></i>
        </button>
      }
      <button
        class="btn btn-danger btn-sm"
        type="button"
        [title]="forbiddenTitle || ('ADMIN_ROLES.GRID.DELETE_TITLE' | translate)"
        [disabled]="!manageAllowed()"
        (click)="onDelete()"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `,
  // Signals, because ag-Grid reuses a cell through refresh() rather than
  // re-creating it, and an OnPush template would not see a plain field change.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleActionsCellRendererComponent implements ICellRendererAngularComp {
  private dataset!: AccessControlMetadata;
  private editMetadataCallback!: (dataset: AccessControlMetadata) => void;
  private editGroupRightsCallback!: (dataset: AccessControlMetadata) => void;
  private deleteCallback!: (dataset: AccessControlMetadata) => void;
  private editDatasetPermissionsCallback!: (dataset: AccessControlMetadata) => void;
  protected readonly manageAllowed = signal(false);
  protected readonly datasetPermissionsAllowed = signal(false);
  protected readonly groupName = signal('');

  agInit(params: RoleActionsCellRendererParams): void {
    this.editMetadataCallback = params.onEditMetadata;
    this.editGroupRightsCallback = params.onEditGroupRights;
    this.deleteCallback = params.onDelete;
    this.editDatasetPermissionsCallback = params.onEditDatasetPermissions;
    this.apply(params);
  }

  refresh(params: RoleActionsCellRendererParams): boolean {
    this.apply(params);
    return true;
  }

  onEditMetadata(): void {
    this.editMetadataCallback(this.dataset);
  }

  onEditGroupRights(): void {
    this.editGroupRightsCallback(this.dataset);
  }

  onDelete(): void {
    this.deleteCallback(this.dataset);
  }

  onEditDatasetPermissions(): void {
    this.editDatasetPermissionsCallback(this.dataset);
  }

  private apply(params: RoleActionsCellRendererParams): void {
    this.dataset = params.data!;
    this.groupName.set(this.dataset?.name ?? '');
    this.manageAllowed.set(!!this.dataset && params.canManage(this.dataset));
    this.datasetPermissionsAllowed.set(
      !!this.dataset && params.canEditDatasetPermissions(this.dataset)
    );
  }
}
