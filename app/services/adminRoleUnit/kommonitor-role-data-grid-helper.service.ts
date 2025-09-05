import { Injectable } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { KommonitorDataGridHelperService } from '../adminSpatialUnit/kommonitor-data-grid-helper.service';

@Injectable({ providedIn: 'root' })
export class KommonitorRoleDataGridHelperService {
  constructor(private baseGridHelper: KommonitorDataGridHelperService) {}

  getRoleManagementGridComponents(): any {
    return this.baseGridHelper.getRoleManagementComponents();
  }

  buildRoleManagementDefaultColDef(): any {
    return this.baseGridHelper.buildRoleManagementDefaultColDef();
  }

  buildRoleManagementGridOptionsPublic(components?: any): GridOptions {
    return this.baseGridHelper.buildRoleManagementGridOptionsPublic(components);
  }

  buildRoleManagementGridRowData(accessControlMetadata: any[], selectedPermissionIds: string[]): any[] {
    return (this.baseGridHelper as any).buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);
  }

  buildRoleManagementGridColumnConfig(reducedRoleManagement: boolean = false): any[] {
    return (this.baseGridHelper as any).buildRoleManagementGridColumnConfig(reducedRoleManagement);
  }
}


