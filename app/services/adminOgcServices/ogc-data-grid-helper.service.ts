import { Injectable, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { Topic } from 'components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { OgcService } from 'services/ogcServices/ogc.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

@Injectable({
  providedIn: 'root',
})
export class OgcDataGridHelperService {
  private topicStore = inject(TopicMetadataStoreService);
  private ogcService = inject(OgcService);

  // Store the data grid options
  private dataGridOptions_wms: GridOptions | null = null;

  // Grid references
  private wmsGrid: AgGridAngular | null = null;

  // Component reference for callbacks
  private componentRef: any = null;

  /**
   * Initialize the grid references
   */
  initializeGrids(wmsGrid: AgGridAngular): void {
    this.wmsGrid = wmsGrid;
  }

  /**
   * Set component reference for callbacks
   */
  setComponentRef(componentRef: any): void {
    this.componentRef = componentRef;

    // Update column definitions with the component reference for all grids
    this.updateColumnDefinitions();
  }

  /**
   * Update column definitions with the current component reference
   */
  private updateColumnDefinitions(): void {
    if (this.wmsGrid && this.wmsGrid.api) {
      const wmsColumnDefs = this.getWmsColumnDefinitions();
      this.wmsGrid.api.setGridOption('columnDefs', wmsColumnDefs);
    }
  }

  buildDataGrid_wms(georesourcesArray: any[]): void {
    if (!georesourcesArray || georesourcesArray.length === 0) {
      console.warn('No georesources data provided to buildDataGrid_wms');
      return;
    }

    if (!this.wmsGrid) {
      console.warn('Grid references not initialized');
      return;
    }

    this.buildWmsGrid(georesourcesArray);
  }

  /**
   * Build WMS grid
   */
  private buildWmsGrid(georesourcesArray: WmsDataset[]): void {
    if (!this.wmsGrid) {
      return;
    }

    const columnDefs = this.getWmsColumnDefinitions();

    try {
      this.wmsGrid.api?.setGridOption('rowData', georesourcesArray);
      this.wmsGrid.api?.setGridOption('columnDefs', columnDefs);
    } catch (error) {
      console.error('Error updating POI grid:', error);
    }
  }

  /**
   * Get grid options for WMS grid (for ag-grid-angular)
   */
  getWmsGridOptions(): any {
    return {
      components: {
        displayEditButtons_WMSgeoresources: this.displayEditButtons_WMSgeoresources,
      },
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
      suppressColumnVirtualisation: true,
    };
  }

  /**
   * Simple function-based cell renderer for edit buttons (like original)
   */
  private displayEditButtons_WMSgeoresources = (params: any) => {
    if (!params.data || !params.data.id) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }

    // Check user permissions (handle both array and potential undefined)
    const userPermissions = params.data.userPermissions || [];
    const hasEditorPermission = Array.isArray(userPermissions)
      ? userPermissions.includes('editor') || userPermissions.includes('creator')
      : false;
    const hasCreatorPermission = Array.isArray(userPermissions)
      ? userPermissions.includes('creator')
      : false;

    const buttonWrapper = document.createElement('div');

    buttonWrapper.appendChild(this.buildEditButton(params, hasEditorPermission));
    buttonWrapper.appendChild(this.buildEditUserRolesButton(params, hasCreatorPermission));
    buttonWrapper.appendChild(this.buildDeleteButton(params, hasCreatorPermission));

    return buttonWrapper;
  };

  buildEditButton(params: any, hasEditorPermission: boolean) {
    const button = document.createElement('button');
    button.title = 'Zugriffsschutz und Eigentümerschaft editieren';
    button.className = 'btn btn-warning btn-sm';

    if (!hasEditorPermission) {
      button.disabled = true;
    }

    // Icon <i class="fas fa-pencil-alt"></i>
    const icon = document.createElement('i');
    icon.className = 'fas fa-pencil-alt';

    button.appendChild(icon);

    // Click-Event
    button.addEventListener('click', (event) => {
      event.stopPropagation(); // verhindert Row-Click

      if (!hasEditorPermission) {
        return;
      }

      this.componentRef.onClickEditMetadata(params.data);
    });

    return button;
  }

  buildEditUserRolesButton(params: any, hasCreatorPermission: boolean) {
    const button = document.createElement('button');
    button.title = 'Metadaten editieren';
    button.className = 'btn btn-warning btn-sm';

    if (!hasCreatorPermission) {
      button.disabled = true;
    }

    const icon = document.createElement('i');
    icon.className = 'fas fa-user-lock';

    button.appendChild(icon);

    // Click-Event
    button.addEventListener('click', (event) => {
      event.stopPropagation(); // verhindert Row-Click

      if (!hasCreatorPermission) {
        return;
      }

      this.componentRef.onClickEditUserRoles(params.data);
    });

    return button;
  }

  buildDeleteButton(params: any, hasCreatorPermission: boolean) {
    const button = document.createElement('button');
    button.title = 'WMS entfernen';
    button.className = 'btn btn-danger btn-sm';

    if (!hasCreatorPermission) {
      button.disabled = true;
    }

    // Icon <i class="fas fa-pencil-alt"></i>
    const icon = document.createElement('i');
    icon.className = 'fas fa-trash';

    button.appendChild(icon);

    // Click-Event
    button.addEventListener('click', (event) => {
      event.stopPropagation(); // verhindert Row-Click

      if (!hasCreatorPermission) {
        return;
      }

      this.componentRef.onClickDelete(params.data);
    });

    return button;
  }

  /**
   * Get WMS column definitions
   */
  private getWmsColumnDefinitions(): ColDef[] {
    return [
      {
        headerName: 'Editierfunktionen',
        maxWidth: 200,
        minWidth: 180,
        checkboxSelection: false,
        headerCheckboxSelection: false,
        headerCheckboxSelectionFilteredOnly: true,
        filter: false,
        sortable: false,
        cellRenderer: 'displayEditButtons_WMSgeoresources',
        flex: 1,
      },
      {
        headerName: 'Id',
        field: 'id',
        maxWidth: 125,
        flex: 1,
      },
      {
        headerName: 'Name',
        field: 'title',
        minWidth: 300,
        flex: 1,
      },
      {
        headerName: 'Legende',
        minWidth: 400,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          return `<img src="${this.ogcService.buildLegendUrl(params.data.connectionDetails.baseUrl, params.data.connectionDetails.layerName)}">`;
        },
        flex: 1,
      },
      {
        headerName: 'Beschreibung',
        cellRenderer: (params: any) => {
          return params.data.description || '';
        },
        flex: 1,
      },
      {
        headerName: 'Themenhierarchie',
        cellRenderer: this.translateTopicsReferences,
        flex: 1,
      },
    ];
  }

  private translateTopicsReferences = (params: any) => {
    if (!params.data || !params.data.topicReference) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }

    const topic: Topic = this.topicStore.availableTopics.find(
      (e: Topic) => e.topicId == params.data.topicReference
    );

    if (!topic) return 'Topic not found';

    return topic.topicName;
  };
}
