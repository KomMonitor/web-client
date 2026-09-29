import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

export interface RoleActionsCellRendererParams extends ICellRendererParams<AccessControlMetadata> {
  onEditMetadata: (dataset: AccessControlMetadata) => void;
  onEditGroupRights: (dataset: AccessControlMetadata) => void;
  onDelete: (dataset: AccessControlMetadata) => void;
  canDelete: () => boolean;
}

@Component({
  selector: 'app-role-actions-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="btn-group btn-group-sm">
      <button
        class="btn btn-warning btn-sm"
        type="button"
        [title]="'ADMIN_SHARED_UI.GRID.EDIT_METADATA_TITLE' | translate"
        (click)="onEditMetadata()"
      >
        <i class="fas fa-pencil-alt"></i>
      </button>
      <button
        class="btn btn-warning btn-sm"
        type="button"
        [title]="'ADMIN_ROLES.GRID.EDIT_GROUP_RIGHTS_TITLE' | translate"
        (click)="onEditGroupRights()"
      >
        <i class="fas fa-user-lock"></i>
      </button>
      <button
        class="btn btn-danger btn-sm"
        type="button"
        [title]="'ADMIN_ROLES.GRID.DELETE_TITLE' | translate"
        [disabled]="!deleteAllowed"
        (click)="onDelete()"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `,
  // The template only binds `deleteAllowed`, which is set in agInit() before
  // the first render; the fields updated by refresh() are not bound, so they
  // need no signal conversion.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleActionsCellRendererComponent implements ICellRendererAngularComp {
  private dataset!: AccessControlMetadata;
  private editMetadataCallback!: (dataset: AccessControlMetadata) => void;
  private editGroupRightsCallback!: (dataset: AccessControlMetadata) => void;
  private deleteCallback!: (dataset: AccessControlMetadata) => void;
  protected deleteAllowed = false;

  agInit(params: RoleActionsCellRendererParams): void {
    this.dataset = params.data!;
    this.editMetadataCallback = params.onEditMetadata;
    this.editGroupRightsCallback = params.onEditGroupRights;
    this.deleteCallback = params.onDelete;
    this.deleteAllowed = params.canDelete();
  }

  refresh(params: RoleActionsCellRendererParams): boolean {
    this.dataset = params.data!;
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
}
