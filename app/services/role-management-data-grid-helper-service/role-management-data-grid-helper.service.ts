import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GridOptions } from 'ag-grid-community';

/**
 * Helper service for the role-/permission-management ag-Grid used across the
 * admin area.
 *
 * Extracted from `KommonitorDataGridHelperService` (adminSpatialUnit) as the
 * first responsibility split of Prio 7 — see
 * `documentation/PRIO7_GOD_SERVICE_SPLIT.md`.
 *
 * The resource-permission grids themselves live in the shared
 * `<app-role-management-grid>` component (adminShared/roleManagementPanel),
 * which owns its grid API per instance and builds fresh options through
 * `buildRoleManagementGrid`. Besides the panel, only the role-management
 * modals (role-add, role-edit-group-rights) use the base col-def/grid-options
 * builders for their custom grids. The former shared `gridApi` state and its
 * `setGridApi`/`getSelectedRoleIds_roleManagementGrid` accessors are gone —
 * they let concurrently open grids clobber each other.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleManagementDataGridHelperService {
  private translate = inject(TranslateService);

  /**
   * Build default column definition for role management grids
   */
  buildRoleManagementDefaultColDef(): any {
    return {
      editable: false,
      sortable: true,
      flex: 1,
      minWidth: 100,
      filter: false,
      floatingFilter: false,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        'font-size': '12px',
        'white-space': 'normal !important',
        'line-height': '20px !important',
        'word-break': 'break-word !important',
        'padding-top': '17px',
        'padding-bottom': '17px',
      },
      headerComponentParams: {
        template:
          '<div class="ag-cell-label-container" role="presentation">' +
          '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
          '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
          '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
          '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
          '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
          '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
          '  </div>' +
          '</div>',
      },
    };
  }

  /**
   * Build grid options for role management grids (public method for components)
   */
  buildRoleManagementGridOptionsPublic(components?: any): GridOptions {
    return {
      components: components || {},
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
      suppressColumnVirtualisation: true,
      headerHeight: 40,
      rowHeight: 35,
    };
  }

  /**
   * Build fresh role-management grid options (column defs, row data, checkbox
   * cell-renderer components) from the access-control list and the selected
   * permission ids. Consumed by `<app-role-management-grid>`, which pushes the
   * fresh columnDefs/rowData through its bindings on every rebuild.
   */
  buildRoleManagementGrid(
    _tableDOMId: string,
    _currentTableOptionsObject: any,
    accessControlMetadata: any[],
    selectedPermissionIds: string[],
    reducedRoleManagement: boolean = false
  ): any {
    return this.buildRoleManagementGridOptions(
      accessControlMetadata,
      selectedPermissionIds,
      reducedRoleManagement
    );
  }

  /**
   * Build role management grid row data
   */
  private buildRoleManagementGridRowData(
    accessControlMetadata: any[],
    permissionIds: string[]
  ): any[] {
    // Flatten permissions into boolean fields for ag-Grid built-in checkbox renderer
    const data = JSON.parse(JSON.stringify(accessControlMetadata));
    for (const elem of data) {
      if (elem.name === 'public') {
        elem.name = this.translate.instant('ADMIN_ROLES.GRID.PUBLIC_ACCESS');
      }
      // Flatten permissions
      elem.viewer = false;
      elem.editor = false;
      elem.creator = false;
      if (elem.permissions && Array.isArray(elem.permissions)) {
        for (const permission of elem.permissions) {
          const isChecked = !!(permissionIds && permissionIds.includes(permission.permissionId));
          // keep permissions[] state in sync (as in AngularJS)
          permission.isChecked = isChecked;

          if (permission.permissionLevel === 'viewer') {
            elem.viewer = isChecked;
          }
          if (permission.permissionLevel === 'editor') {
            elem.editor = isChecked;
          }
          if (permission.permissionLevel === 'creator') {
            elem.creator = isChecked;
          }
        }
      }
    }
    // Keep the original sorting logic
    const array: any[] = [];
    array.push(data[0]);
    array.push(data[1]);
    data.splice(0, 2);
    data.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return array.concat(data);
  }

  private buildRoleManagementGridColumnConfig(reducedRoleManagement: boolean = false): any[] {
    const columnDefs = [
      {
        headerName: this.translate.instant('ADMIN_ROLES.GRID.COL_ORG_UNIT'),
        field: 'name',
        minWidth: 200,
        cellClass: 'user-roles-normal',
      },
      {
        headerName: this.translate.instant('ADMIN_ROLES.GRID.COL_READ'),
        field: 'viewer',
        filter: false,
        sortable: false,
        width: 100,
        cellRenderer: 'CheckboxRenderer_viewer',
        editable: true,
      },
      {
        headerName: this.translate.instant('ADMIN_ROLES.GRID.COL_EDIT'),
        field: 'editor',
        filter: false,
        sortable: false,
        width: 100,
        cellRenderer: 'CheckboxRenderer_editor',
        editable: true,
      },
    ];
    if (!reducedRoleManagement) {
      columnDefs.push({
        headerName: this.translate.instant('ADMIN_ROLES.GRID.COL_DELETE'),
        field: 'creator',
        filter: false,
        sortable: false,
        width: 100,
        cellRenderer: 'CheckboxRenderer_creator',
        editable: true,
      });
    }
    return columnDefs;
  }

  private buildRoleManagementGridOptions(
    accessControlMetadata: any[],
    selectedPermissionIds: string[],
    reducedRoleManagement: boolean = false
  ): any {
    const columnDefs = this.buildRoleManagementGridColumnConfig(reducedRoleManagement);
    const rowData = this.buildRoleManagementGridRowData(
      accessControlMetadata,
      selectedPermissionIds
    );
    const gridOptions = {
      components: {
        CheckboxRenderer_viewer: this.CheckboxRenderer_viewer,
        CheckboxRenderer_editor: this.CheckboxRenderer_editor,
        CheckboxRenderer_creator: this.CheckboxRenderer_creator,
      },
      defaultColDef: {
        editable: false,
        sortable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: false,
        resizable: true,
        wrapText: true,
        autoHeight: true,
        cellStyle: {
          'font-size': '12px',
          'white-space': 'normal !important',
          'line-height': '20px !important',
          'word-break': 'break-word !important',
          'padding-top': '17px',
          'padding-bottom': '17px',
        },
        headerComponentParams: {
          template:
            '<div class="ag-cell-label-container" role="presentation">' +
            '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
            '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
            '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
            '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
            '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
            '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
            '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
            '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
            '  </div>' +
            '</div>',
        },
      },
      columnDefs: columnDefs,
      rowData: rowData,
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
      suppressColumnVirtualisation: true,
    };
    return gridOptions;
  }

  /**
   * Expose role management checkbox renderer components for early binding in templates
   */
  public getRoleManagementComponents(): any {
    return {
      CheckboxRenderer_viewer: this.CheckboxRenderer_viewer,
      CheckboxRenderer_editor: this.CheckboxRenderer_editor,
      CheckboxRenderer_creator: this.CheckboxRenderer_creator,
    };
  }

  /**
   * Checkbox renderer for viewer permissions
   */
  private CheckboxRenderer_viewer = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      if (params && params.data) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel == 'viewer') {
            exists = true;
            isChecked = permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable viewer if dataset owner or if editor/creator selection implies viewer
        if (
          this.params.data.datasetOwner === true ||
          this.params.data._viewerDisabledBecauseOfEditor === true ||
          this.params.data._viewerDisabledBecauseOfCreator === true
        ) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;

      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == 'viewer') {
          permission.isChecked = checked;
          break;
        }
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Checkbox renderer for editor permissions
   */
  private CheckboxRenderer_editor = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      if (params && params.data) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel == 'editor') {
            exists = true;
            isChecked = permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable editor if dataset owner or if creator selection implies editor
        if (
          this.params.data.datasetOwner === true ||
          this.params.data._editorDisabledBecauseOfCreator === true
        ) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == 'viewer') {
          if (checked) {
            permission.isChecked = true;
          } else {
            permission.isChecked = false;
          }
        } else if (permission.permissionLevel == 'editor') {
          permission.isChecked = checked;
        }
      }
      // If editor is checked, enforce viewer checked+disabled
      if (checked) {
        this.params.data._viewerDisabledBecauseOfEditor = true;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == 'viewer') {
            permission.isChecked = true;
          }
        }
      } else {
        this.params.data._viewerDisabledBecauseOfEditor = false;
      }
      // Ask grid to refresh this row to update disabled state of viewer column
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Checkbox renderer for creator permissions
   */
  private CheckboxRenderer_creator = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      for (const permission of params.data.permissions) {
        if (permission.permissionLevel == 'creator') {
          exists = true;
          isChecked = permission.isChecked;
          className = permission.permissionId;
          break;
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable creator if dataset owner is true
        if (this.params.data.datasetOwner === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (
          permission.permissionLevel == 'creator' ||
          permission.permissionLevel == 'editor' ||
          permission.permissionLevel == 'viewer'
        ) {
          permission.isChecked = checked;
        }
      }
      // If creator is checked, enforce editor and viewer checked+disabled
      if (checked) {
        this.params.data._editorDisabledBecauseOfCreator = true;
        this.params.data._viewerDisabledBecauseOfCreator = true;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == 'editor' || permission.permissionLevel == 'viewer') {
            permission.isChecked = true;
          }
        }
      } else {
        this.params.data._editorDisabledBecauseOfCreator = false;
        this.params.data._viewerDisabledBecauseOfCreator = false;
      }
      // Ask grid to refresh this row to update disabled state of editor/viewer columns
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };
}
