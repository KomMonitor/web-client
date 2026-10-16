import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

export interface RoleActionsCellRendererParams extends ICellRendererParams<AccessControlMetadata> {
  onEditMetadata: (dataset: AccessControlMetadata) => void;
  onEditGroupRights: (dataset: AccessControlMetadata) => void;
  onDelete: (dataset: AccessControlMetadata) => void;
  /**
   * Whether the user may manage this group. Editing it, delegating its rights
   * and deleting it are one rule in the API, so one answer gates all three.
   */
  canManage: (dataset: AccessControlMetadata) => boolean;
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
  protected readonly manageAllowed = signal(false);
  protected readonly groupName = signal('');

  agInit(params: RoleActionsCellRendererParams): void {
    this.editMetadataCallback = params.onEditMetadata;
    this.editGroupRightsCallback = params.onEditGroupRights;
    this.deleteCallback = params.onDelete;
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

  private apply(params: RoleActionsCellRendererParams): void {
    this.dataset = params.data!;
    this.groupName.set(this.dataset?.name ?? '');
    this.manageAllowed.set(!!this.dataset && params.canManage(this.dataset));
  }
}
