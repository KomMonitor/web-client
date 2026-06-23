import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AccessControlMetadata } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';

export interface RoleActionsCellRendererParams extends ICellRendererParams<AccessControlMetadata> {
  onEditMetadata: (dataset: AccessControlMetadata) => void;
  onDelete: (dataset: AccessControlMetadata) => void;
}

@Component({
  selector: 'app-role-actions-cell-renderer',
  standalone: true,
  template: `
    <div class="btn-group btn-group-sm">
      <button
        class="btn btn-warning btn-sm"
        type="button"
        title="Metadaten editieren"
        (click)="onEditMetadata()"
      >
        <i class="fas fa-pencil-alt"></i>
      </button>
      <button class="btn btn-warning btn-sm" type="button" title="Löschen" (click)="onDelete()">
        <i class="fas fa-user-lock"></i>
      </button>
    </div>
  `,
})
export class RoleActionsCellRendererComponent implements ICellRendererAngularComp {
  private dataset!: AccessControlMetadata;
  private editMetadataCallback!: (dataset: AccessControlMetadata) => void;
  private deleteCallback!: (dataset: AccessControlMetadata) => void;

  agInit(params: RoleActionsCellRendererParams): void {
    this.dataset = params.data!;
    this.editMetadataCallback = params.onEditMetadata;
    this.deleteCallback = params.onDelete;
  }

  refresh(params: RoleActionsCellRendererParams): boolean {
    this.dataset = params.data!;
    return true;
  }

  onEditMetadata(): void {
    this.editMetadataCallback(this.dataset);
  }

  onDelete(): void {
    this.deleteCallback(this.dataset);
  }
}
