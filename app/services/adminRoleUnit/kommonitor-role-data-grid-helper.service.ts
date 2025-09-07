import { Injectable } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { KommonitorDataGridHelperService } from '../adminSpatialUnit/kommonitor-data-grid-helper.service';

@Injectable({ providedIn: 'root' })
export class KommonitorRoleDataGridHelperService {
  constructor(private baseGridHelper: KommonitorDataGridHelperService) {}

  getRoleManagementGridComponents(): any {
    return this.baseGridHelper.getRoleManagementComponents();
  }

  getAdvancedRoleManagementGridComponents(): any {
    return {
      CheckboxRenderer_UM_group: this.CheckboxRenderer_UM_group,
      CheckboxRenderer_UM_subGroup: this.CheckboxRenderer_UM_subGroup,
      CheckboxRenderer_RM_group: this.CheckboxRenderer_RM_group,
      CheckboxRenderer_RM_subGroup: this.CheckboxRenderer_RM_subGroup,
      CheckboxRenderer_TM_group: this.CheckboxRenderer_TM_group,
      CheckboxRenderer_TM_subGroup: this.CheckboxRenderer_TM_subGroup,
    } as any;
  }

  // Inline implementations mirroring AngularJS renderers
  private CheckboxRenderer_UM_group = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;
    init(params: any) {
      this.params = params;
      let isChecked = false;
      let exists = false;
      let subChecked = false;
      let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'unit-users-creator') {
            exists = true; isChecked = !!permission.isChecked; className = permission.permissionId;
          }
          if (permission.permissionLevel === 'client-users-creator') { subChecked = !!permission.isChecked; }
        }
      }
      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input; input.type = 'checkbox'; input.className = className || '';
        input.checked = isChecked; input.disabled = !!(params.data?.disabled || subChecked || params.data?._umGroupDisabledBecauseOfClient);
        this.boundCheckedHandler = this.checkedHandler.bind(this); input.addEventListener('click', this.boundCheckedHandler);
      } else { this.eGui = document.createElement('span'); }
    }
    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-users-creator') { permission.isChecked = checked; break; }
      }
    }
    getGui() { return this.eGui; }
    destroy() { if (this.eGui && this.boundCheckedHandler) { this.eGui.removeEventListener('click', this.boundCheckedHandler); } }
  };

  private CheckboxRenderer_UM_subGroup = class {
    private params: any; private eGui: HTMLElement | null = null; private boundCheckedHandler: any;
    init(params: any) {
      this.params = params; let isChecked = false; let exists = false; let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'client-users-creator') { exists = true; isChecked = !!permission.isChecked; className = permission.permissionId; break; }
        }
      }
      if (exists) { const input = document.createElement('input') as HTMLInputElement; this.eGui = input; input.type = 'checkbox'; input.className = className || ''; input.checked = isChecked; input.disabled = !!this.params.data?.disabled; this.boundCheckedHandler = this.checkedHandler.bind(this); input.addEventListener('click', this.boundCheckedHandler); }
      else { this.eGui = document.createElement('span'); }
    }
    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-users-creator') { permission.isChecked = checked ? true : permission.isChecked; this.params.data._umGroupDisabledBecauseOfClient = checked; }
        if (permission.permissionLevel === 'client-users-creator') { permission.isChecked = checked; }
      }
      if (this.params.api && this.params.node) { this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] }); }
    }
    getGui() { return this.eGui; }
    destroy() { if (this.eGui && this.boundCheckedHandler) { this.eGui.removeEventListener('click', this.boundCheckedHandler); } }
  };

  private CheckboxRenderer_RM_group = class {
    private params: any; private eGui: HTMLElement | null = null; private boundCheckedHandler: any;
    init(params: any) {
      this.params = params; let isChecked = false; let exists = false; let subChecked = false; let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'unit-resources-creator') { exists = true; isChecked = !!permission.isChecked; className = permission.permissionId; }
          if (permission.permissionLevel === 'client-resources-creator') { subChecked = !!permission.isChecked; }
        }
      }
      if (exists) { const input = document.createElement('input') as HTMLInputElement; this.eGui = input; input.type = 'checkbox'; input.className = className || ''; input.checked = isChecked; input.disabled = !!(params.data?.disabled || subChecked || params.data?._rmGroupDisabledBecauseOfClient); this.boundCheckedHandler = this.checkedHandler.bind(this); input.addEventListener('click', this.boundCheckedHandler); }
      else { this.eGui = document.createElement('span'); }
    }
    checkedHandler(e: any) { const checked = e.target.checked; for (const permission of this.params.data.permissions) { if (permission.permissionLevel === 'unit-resources-creator') { permission.isChecked = checked; break; } } }
    getGui() { return this.eGui; }
    destroy() { if (this.eGui && this.boundCheckedHandler) { this.eGui.removeEventListener('click', this.boundCheckedHandler); } }
  };

  private CheckboxRenderer_RM_subGroup = class {
    private params: any; private eGui: HTMLElement | null = null; private boundCheckedHandler: any;
    init(params: any) {
      this.params = params; let isChecked = false; let exists = false; let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'client-resources-creator') { exists = true; isChecked = !!permission.isChecked; className = permission.permissionId; break; }
        }
      }
      if (exists) { const input = document.createElement('input') as HTMLInputElement; this.eGui = input; input.type = 'checkbox'; input.className = className || ''; input.checked = isChecked; input.disabled = !!this.params.data?.disabled; this.boundCheckedHandler = this.checkedHandler.bind(this); input.addEventListener('click', this.boundCheckedHandler); }
      else { this.eGui = document.createElement('span'); }
    }
    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-resources-creator') { permission.isChecked = checked ? true : permission.isChecked; this.params.data._rmGroupDisabledBecauseOfClient = checked; }
        if (permission.permissionLevel === 'client-resources-creator') { permission.isChecked = checked; }
      }
      if (this.params.api && this.params.node) { this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] }); }
    }
    getGui() { return this.eGui; }
    destroy() { if (this.eGui && this.boundCheckedHandler) { this.eGui.removeEventListener('click', this.boundCheckedHandler); } }
  };

  private CheckboxRenderer_TM_group = class {
    private params: any; private eGui: HTMLElement | null = null; private boundCheckedHandler: any;
    init(params: any) {
      this.params = params; let isChecked = false; let exists = false; let subChecked = false; let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'unit-themes-creator') { exists = true; isChecked = !!permission.isChecked; className = permission.permissionId; }
          if (permission.permissionLevel === 'client-themes-creator') { subChecked = !!permission.isChecked; }
        }
      }
      if (exists) { const input = document.createElement('input') as HTMLInputElement; this.eGui = input; input.type = 'checkbox'; input.className = className || ''; input.checked = isChecked; input.disabled = !!(params.data?.disabled || subChecked || params.data?._tmGroupDisabledBecauseOfClient); this.boundCheckedHandler = this.checkedHandler.bind(this); input.addEventListener('click', this.boundCheckedHandler); }
      else { this.eGui = document.createElement('span'); }
    }
    checkedHandler(e: any) { const checked = e.target.checked; for (const permission of this.params.data.permissions) { if (permission.permissionLevel === 'unit-themes-creator') { permission.isChecked = checked; break; } } }
    getGui() { return this.eGui; }
    destroy() { if (this.eGui && this.boundCheckedHandler) { this.eGui.removeEventListener('click', this.boundCheckedHandler); } }
  };

  private CheckboxRenderer_TM_subGroup = class {
    private params: any; private eGui: HTMLElement | null = null; private boundCheckedHandler: any;
    init(params: any) {
      this.params = params; let isChecked = false; let exists = false; let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'client-themes-creator') { exists = true; isChecked = !!permission.isChecked; className = permission.permissionId; break; }
        }
      }
      if (exists) { const input = document.createElement('input') as HTMLInputElement; this.eGui = input; input.type = 'checkbox'; input.className = className || ''; input.checked = isChecked; input.disabled = !!this.params.data?.disabled; this.boundCheckedHandler = this.checkedHandler.bind(this); input.addEventListener('click', this.boundCheckedHandler); }
      else { this.eGui = document.createElement('span'); }
    }
    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-themes-creator') { permission.isChecked = checked ? true : permission.isChecked; this.params.data._tmGroupDisabledBecauseOfClient = checked; }
        if (permission.permissionLevel === 'client-themes-creator') { permission.isChecked = checked; }
      }
      if (this.params.api && this.params.node) { this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] }); }
    }
    getGui() { return this.eGui; }
    destroy() { if (this.eGui && this.boundCheckedHandler) { this.eGui.removeEventListener('click', this.boundCheckedHandler); } }
  };

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

  buildAdvancedRoleManagementGrid(
    tableDOMId: string,
    currentTableOptionsObject: any,
    accessControlMetadata: any[],
    selectedPermissionIds: string[],
    reducedRoleManagement: boolean = false
  ): any {
    return (this.baseGridHelper as any).buildRoleManagementGrid(
      tableDOMId,
      currentTableOptionsObject,
      accessControlMetadata,
      selectedPermissionIds,
      reducedRoleManagement
    );
  }

  getSelectedRoleIds_roleManagementGrid(roleManagementTableOptions: any): string[] {
    return (this.baseGridHelper as any).getSelectedRoleIds_roleManagementGrid(roleManagementTableOptions);
  }

  setGridApi(api: any): void {
    (this.baseGridHelper as any).setGridApi(api);
  }
}


