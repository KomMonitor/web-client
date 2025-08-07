import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { MultiStepHelperServiceService } from 'services/multi-step-helper-service/multi-step-helper-service.service';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, ColumnApi, GridReadyEvent } from 'ag-grid-community';

declare const $: any;

@Component({
  selector: 'app-indicator-edit-indicator-spatial-unit-roles-modal',
  templateUrl: './indicator-edit-indicator-spatial-unit-roles-modal.component.html',
  styleUrls: ['./indicator-edit-indicator-spatial-unit-roles-modal.component.css']
})
export class IndicatorEditIndicatorSpatialUnitRolesModalComponent implements OnInit {
  @ViewChild('indicatorEditRoleManagementTable', { static: true }) indicatorEditRoleManagementTable!: AgGridAngular;
  @ViewChild('indicatorEditIndicatorSpatialUnitsRoleManagementTable', { static: true }) indicatorEditIndicatorSpatialUnitsRoleManagementTable!: AgGridAngular;
  
  // Form data
  currentIndicatorDataset: any;
  targetApplicableSpatialUnit: any;
  
  // Role management tables - AG Grid Angular
  public indicatorMetadataColumnDefs: ColDef[] = [];
  public indicatorMetadataRowData: any[] = [];
  public indicatorMetadataGridOptions: GridOptions = {};
  public indicatorSpatialUnitColumnDefs: ColDef[] = [];
  public indicatorSpatialUnitRowData: any[] = [];
  public indicatorSpatialUnitGridOptions: GridOptions = {};
  
  // Grid APIs
  public indicatorMetadataGridApi!: GridApi;
  public indicatorSpatialUnitGridApi!: GridApi;
  
  // Messages
  successMessagePart: string = '';
  errorMessagePart: string = '';
  
  // Form controls
  ownerOrgFilter: string = '';
  ownerOrganization: any;
  activeRolesOnly: boolean = true;
  activeConnectedRolesOnly: boolean = false;
  permissions: any[] = [];
  resourcesCreatorRights: any[] = [];
  
  // Loading states
  loadingData: boolean = false;
  
  // Multi-step form
  currentStep: number = 1;
  totalSteps: number = 3;
  
  constructor(
    public activeModal: NgbActiveModal,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private dataExchangeService: DataExchangeService,
    private dataGridHelperService: KommonitorIndicatorDataGridHelperService,
    public kommonitorIndicatorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private multiStepHelperService: MultiStepHelperServiceService
  ) {}

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeForm();
    
    // Load access control data if not already loaded
    this.loadAccessControlData();
    
    // If currentIndicatorDataset is already set (from parent component), initialize form
    if (this.currentIndicatorDataset) {
      this.onEditIndicatorSpatialUnitRoles(this.currentIndicatorDataset);
    }
  }

  private async loadAccessControlData(): Promise<void> {
    try {
      await this.kommonitorIndicatorDataExchangeService.fetchAccessControlMetadata();
      
      // If no access control data is loaded, create some test data for development
      if (!this.kommonitorIndicatorDataExchangeService.accessControl || this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
        this.createTestAccessControlData();
      }
    } catch (error) {
      // Create test data as fallback
      this.createTestAccessControlData();
    }
  }

  /**
   * Create test access control data for development
   */
  private createTestAccessControlData(): void {
    const testData = [
      {
        organizationalUnitId: 'test-org-1',
        name: 'Test Organization 1',
        permissions: [
          {
            permissionId: 'viewer-perm-1',
            permissionLevel: 'viewer',
            isChecked: false
          },
          {
            permissionId: 'editor-perm-1',
            permissionLevel: 'editor',
            isChecked: false
          },
          {
            permissionId: 'creator-perm-1',
            permissionLevel: 'creator',
            isChecked: false
          }
        ],
        datasetOwner: false
      },
      {
        organizationalUnitId: 'test-org-2',
        name: 'Test Organization 2',
        permissions: [
          {
            permissionId: 'viewer-perm-2',
            permissionLevel: 'viewer',
            isChecked: false
          },
          {
            permissionId: 'editor-perm-2',
            permissionLevel: 'editor',
            isChecked: false
          },
          {
            permissionId: 'creator-perm-2',
            permissionLevel: 'creator',
            isChecked: false
          }
        ],
        datasetOwner: false
      }
    ];
    
    this.kommonitorIndicatorDataExchangeService.accessControl = testData;
  }

  private setupEventListeners(): void {
    // Listen for available roles update event
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'availableRolesUpdate') {
        this.refreshRoleManagementTable_indicatorMetadata();
        this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
      }
    });
  }

  private initializeForm(): void {
    this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
  }

  async onEditIndicatorSpatialUnitRoles(indicatorDataset: any): Promise<void> {
    this.currentIndicatorDataset = indicatorDataset;
    this.prepareCreatorList();
    
    // Ensure access control data is loaded
    await this.loadAccessControlData();
    
    // Fetch the indicator data with permissions if not already present
    if (!this.currentIndicatorDataset.permissions) {
      this.fetchIndicatorWithPermissions();
    } else {
      this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
    }
    
    // Ensure spatial unit is set after form reset
    setTimeout(() => {
      this.ensureSpatialUnitIsSet();
    }, 100);
  }

  private async fetchIndicatorWithPermissions(): Promise<void> {
    // Ensure access control data is loaded first
    await this.loadAccessControlData();
    
    this.http.get(
      this.kommonitorIndicatorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/without-geometry"
    ).subscribe({
      next: async (response: any) => {
        this.currentIndicatorDataset = response;
        this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
      },
      error: (error: any) => {
        console.error('Error fetching indicator with permissions:', error);
        // Fallback to using the original data
        this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
      }
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  prepareCreatorList(): void {
    if (this.kommonitorIndicatorDataExchangeService.currentKeycloakLoginRoles.length > 0) {
      let creatorRights: string[] = [];
      let creatorRightsChildren: string[] = [];
      
      this.kommonitorIndicatorDataExchangeService.currentKeycloakLoginRoles.forEach((roles: string) => {
        let key = roles.split('.')[0];
        let role = roles.split('.')[1];

        // case unit-resources-creator
        if (role == 'unit-resources-creator' && !this.resourcesCreatorRights.includes(key)) {
          creatorRights.push(key);
        }

        // case client-resources-creator, gather unit-ids first, then fetch all unit-data
        if (role == 'client-resources-creator' && !creatorRightsChildren.includes(key)) {
          creatorRightsChildren.push(key);
        }
      });

      // gather all children
      this.gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

      this.resourcesCreatorRights = this.kommonitorIndicatorDataExchangeService.accessControl.filter((elem: any) => creatorRights.includes(elem.name));
    }
  }

  gatherCreatorRightsChildren(creatorRights: string[], creatorRightsChildren: string[]): void {
    if (creatorRightsChildren.length > 0) {
      this.kommonitorIndicatorDataExchangeService.accessControl
        .filter((elem: any) => creatorRightsChildren.includes(elem.name))
        .flatMap((res: any) => res.children)
        .forEach((child: any) => {
          this.kommonitorIndicatorDataExchangeService.accessControl
            .filter((elem: any) => elem.organizationalUnitId == child)
            .forEach((childData: any) => {
              creatorRights.push(childData.name);
              this.gatherCreatorRightsChildren(creatorRights, [childData.name]);
            });
        });
    }
  }

  resetIndicatorEditIndicatorSpatialUnitRolesForm(): void {
    this.ownerOrganization = this.currentIndicatorDataset?.ownerId;
    this.ownerOrgFilter = '';
    this.targetApplicableSpatialUnit = this.currentIndicatorDataset?.applicableSpatialUnits?.[0];

    this.refreshRoleManagementTable_indicatorMetadata();
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();

    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.hideSuccessAlert();
    this.hideErrorAlert();
  }

  /**
   * Ensure spatial unit is set for the grid to be enabled
   */
  private ensureSpatialUnitIsSet(): void {
    // Use the first applicable spatial unit from the indicator dataset
    if (!this.targetApplicableSpatialUnit && 
        this.currentIndicatorDataset?.applicableSpatialUnits?.length > 0) {
      this.targetApplicableSpatialUnit = this.currentIndicatorDataset.applicableSpatialUnits[0];
    }
  }

  refreshRoleManagementTable_indicatorMetadata(): void {
    // Ensure access control data is loaded before proceeding
    if (!this.kommonitorIndicatorDataExchangeService.accessControl || this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
      this.loadAccessControlData().then(() => {
        this.refreshRoleManagementTable_indicatorMetadata();
      });
      return;
    }
    
    // Use current user's login role IDs as initial permissions (like in features modal)
    let permissions = this.kommonitorIndicatorDataExchangeService.getCurrentKomMonitorLoginRoleIds();
    
    // If we have current indicator dataset permissions, use those instead
    if (this.currentIndicatorDataset && this.currentIndicatorDataset.permissions) {
      permissions = this.currentIndicatorDataset.permissions;
    }
    
    if (this.currentIndicatorDataset) {
      const accessControl = this.kommonitorIndicatorDataExchangeService.getAccessControlById(this.currentIndicatorDataset.ownerId);
      
      if (accessControl && accessControl.permissions) {
        const permissionIds_ownerUnit = accessControl.permissions
          .filter((permission: any) => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor")
          .map((permission: any) => permission.permissionId);
        
        permissions = permissions.concat(permissionIds_ownerUnit);
      }
    }

    // Set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorIndicatorDataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentIndicatorDataset) {
        if (item.organizationalUnitId == this.currentIndicatorDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    // Build role management grid using AG Grid Angular
    this.buildIndicatorMetadataGrid(this.kommonitorIndicatorDataExchangeService.accessControl, permissions);
  }

  refreshRoleManagementTable_indicatorSpatialUnitTimeseries(): void {
    // Ensure access control data is loaded before proceeding
    if (!this.kommonitorIndicatorDataExchangeService.accessControl || this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
      this.loadAccessControlData().then(() => {
        this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
      });
      return;
    }
    
    // Use current user's login role IDs as initial permissions (like in features modal)
    let permissions = this.kommonitorIndicatorDataExchangeService.getCurrentKomMonitorLoginRoleIds();
    
    // If we have target applicable spatial unit permissions, use those instead
    if (this.targetApplicableSpatialUnit && this.targetApplicableSpatialUnit.permissions) {
      permissions = this.targetApplicableSpatialUnit.permissions;
    }
    
    if (this.currentIndicatorDataset) {
      const accessControl = this.kommonitorIndicatorDataExchangeService.getAccessControlById(this.currentIndicatorDataset.ownerId);
      
      if (accessControl && accessControl.permissions) {
        const permissionIds_ownerUnit = accessControl.permissions
          .filter((permission: any) => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor")
          .map((permission: any) => permission.permissionId);
        
        permissions = permissions.concat(permissionIds_ownerUnit);
      }
    }

    // Set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorIndicatorDataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentIndicatorDataset) {
        if (item.organizationalUnitId == this.currentIndicatorDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    // Handle active connected roles only filter - show all by default, filter only when explicitly requested
    if (this.targetApplicableSpatialUnit && this.targetApplicableSpatialUnit.permissions) {
      let connectedAccess = this.kommonitorIndicatorDataExchangeService.accessControl;
      
      // Only apply filtering if explicitly enabled AND there are permissions to filter by
      if (this.targetApplicableSpatialUnit.permissions.length > 0 && this.activeConnectedRolesOnly) {
        connectedAccess = this.kommonitorIndicatorDataExchangeService.accessControl.filter((unit: any) => {
          // Check if this unit has any permissions that match the spatial unit permissions
          const matchingPermissions = unit.permissions.filter((unitPermission: any) => 
            this.targetApplicableSpatialUnit.permissions.includes(unitPermission.permissionId)
          );
          return matchingPermissions.length > 0;
        });
      }

      this.buildIndicatorSpatialUnitGrid(connectedAccess, permissions);
    } else {
      this.activeConnectedRolesOnly = false;
      this.buildIndicatorSpatialUnitGrid(this.kommonitorIndicatorDataExchangeService.accessControl, permissions);
    }
  }

  private buildIndicatorMetadataGrid(accessControl: any[], permissions: string[]): void {
    // Build grid options
    this.indicatorMetadataGridOptions = {
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true
      },
      pagination: true,
      paginationPageSize: 10
    };

    // Build column definitions
    this.indicatorMetadataColumnDefs = this.buildRoleManagementColumnDefs();

    // Build row data
    this.indicatorMetadataRowData = this.buildRoleManagementRowData(accessControl, permissions);
  }

  private buildIndicatorSpatialUnitGrid(accessControl: any[], permissions: string[]): void {
    // Build grid options
    this.indicatorSpatialUnitGridOptions = {
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true
      },
      pagination: true,
      paginationPageSize: 10
    };

    // Build column definitions
    this.indicatorSpatialUnitColumnDefs = this.buildRoleManagementColumnDefs();

    // Build row data
    this.indicatorSpatialUnitRowData = this.buildRoleManagementRowData(accessControl, permissions);
    
    // Force refresh the grid if API is available
    setTimeout(() => {
      this.forceSpatialUnitGridRefresh();
    }, 100);
  }

  private buildRoleManagementColumnDefs(): ColDef[] {
    const columnDefs: ColDef[] = [
      { 
        headerName: 'Organisationseinheit', 
        field: "organizationalUnitName", 
        pinned: 'left', 
        minWidth: 200 
      }
    ];

    // Add permission columns - using the correct German headers from AngularJS
    columnDefs.push(
      { 
        headerName: 'lesen', 
        field: 'viewer', 
        maxWidth: 100,
        cellRenderer: this.dataGridHelperService.CheckboxRenderer_viewer
      },
      { 
        headerName: 'editieren', 
        field: 'editor', 
        maxWidth: 100,
        cellRenderer: this.dataGridHelperService.CheckboxRenderer_editor
      }
    );

    return columnDefs;
  }

  private buildRoleManagementRowData(accessControl: any[], permissions: string[]): any[] {
    if (!accessControl || accessControl.length === 0) {
      return [];
    }

    // Create a deep copy of the data (like AngularJS)
    let data = JSON.parse(JSON.stringify(accessControl));
    
    // Process each item (like AngularJS)
    for (let elem of data) {
      // Handle 'public' name translation (like AngularJS)
      if (elem.name === 'public') {
        elem.name = 'Öffentlicher Zugriff';
      }

      // Process permissions
      for (let permission of elem.permissions) {
        permission.isChecked = false;
        if (permissions && permissions.includes(permission.permissionId)) {
          permission.isChecked = true;
        }
      }
    }

    // Apply special ordering logic (like AngularJS)
    let array: any[] = [];
    
    // Always put first 2 items at the top
    if (data.length > 0) {
      array.push(data[0]);
    }
    if (data.length > 1) {
      array.push(data[1]);
    }

    // Remove first 2 items and sort the rest
    data.splice(0, 2);
    data.sort(function (a: any, b: any) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    // Combine fixed first 2 + sorted rest
    array = array.concat(data);

    // Convert to the format expected by the grid
    return array.map(item => {
      // Extract permission IDs from the permissions array
      const viewerPermission = item.permissions?.find((p: any) => p.permissionLevel === 'viewer');
      const editorPermission = item.permissions?.find((p: any) => p.permissionLevel === 'editor');
      const creatorPermission = item.permissions?.find((p: any) => p.permissionLevel === 'creator');
      
      const viewerPermissionId = viewerPermission?.permissionId || '';
      const editorPermissionId = editorPermission?.permissionId || '';
      const creatorPermissionId = creatorPermission?.permissionId || '';
      
      const result = {
        organizationalUnitId: item.organizationalUnitId,
        organizationalUnitName: item.name,
        viewer: permissions.includes(viewerPermissionId),
        editor: permissions.includes(editorPermissionId),
        creator: permissions.includes(creatorPermissionId),
        datasetOwner: item.datasetOwner || false,
        // Store the permission IDs for later use
        viewerPermissionId: viewerPermissionId,
        editorPermissionId: editorPermissionId,
        creatorPermissionId: creatorPermissionId
      };
      
      return result;
    });
  }

  onActiveConnectedRolesOnlyChange(): void {
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
  }

  onActiveRolesOnlyChange(): void {
    this.refreshRoleManagementTable_indicatorMetadata();
  }

  onChangeOwner(ownerOrganization: any): void {
    this.ownerOrganization = ownerOrganization;
    this.refreshRoles(this.ownerOrganization);
  }

  refreshRoles(orgUnitId: string): void {
    let permissionIds_ownerUnit = orgUnitId ? 
      this.kommonitorIndicatorDataExchangeService.getAccessControlById(orgUnitId).permissions
        .filter((permission: any) => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor")
        .map((permission: any) => permission.permissionId) : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorIndicatorDataExchangeService.accessControl.forEach((item: any) => {
      if (item.organizationalUnitId == orgUnitId) {
        item.datasetOwner = true;
      } else {
        item.datasetOwner = false;
      }
    });

    this.buildIndicatorMetadataGrid(this.kommonitorIndicatorDataExchangeService.accessControl, permissionIds_ownerUnit);
    this.buildIndicatorSpatialUnitGrid(this.kommonitorIndicatorDataExchangeService.accessControl, permissionIds_ownerUnit);
  }

  editIndicatorSpatialUnitRoles(): void {
    if (this.ownerOrganization !== undefined && this.ownerOrganization != this.currentIndicatorDataset.ownerId) {
      if (!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?')) {
        return;
      }
    }

    this.executeRequest_indicatorMetadataRoles();
    this.executeRequest_indicatorOwnership();
    this.executeRequest_indicatorSpatialUnitRoles();
    this.executeRequest_indicatorSpatialUnitOwnership();
  }

  executeRequest_indicatorMetadataRoles(): void {
    this.loadingData = true;

    let putBody = {
      "permissions": this.getSelectedRoleIds_roleManagementGrid(this.indicatorMetadataGridApi),
      "isPublic": this.currentIndicatorDataset.isPublic
    };

    this.http.put(
      this.kommonitorIndicatorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/permissions",
      putBody
    ).subscribe({
      next: (response: any) => {
        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { crudType: 'edit', targetIndicatorId: this.currentIndicatorDataset.indicatorId });
        this.showSuccessAlert();
        this.loadingData = false;
      },
      error: (error: any) => {
        this.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Zugriffsrechte. Fehler lautet: \n\n";
        if (error.data) {
          this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        this.loadingData = false;
      }
    });
  }

  executeRequest_indicatorOwnership(): void {
    this.loadingData = true;

    let putBody = {
      "ownerId": this.ownerOrganization === undefined ? this.currentIndicatorDataset.ownerId : this.ownerOrganization
    };

    this.http.put(
      this.kommonitorIndicatorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/ownership",
      putBody
    ).subscribe({
      next: (response: any) => {
        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { crudType: 'edit', targetIndicatorId: this.currentIndicatorDataset.indicatorId });
        this.showSuccessAlert();
        this.loadingData = false;
      },
      error: (error: any) => {
        this.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n";
        if (error.data) {
          this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        this.loadingData = false;
      }
    });
  }

  executeRequest_indicatorSpatialUnitOwnership(): void {
    this.loadingData = true;

    if (this.currentIndicatorDataset.applicableSpatialUnits && this.currentIndicatorDataset.applicableSpatialUnits.length > 0) {
      this.currentIndicatorDataset.applicableSpatialUnits.forEach((indicatorSpatialUnit: any) => {
        let putBody = {
          "ownerId": this.ownerOrganization === undefined ? this.currentIndicatorDataset.ownerId : this.ownerOrganization
        };

        this.http.put(
          this.kommonitorIndicatorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + indicatorSpatialUnit.spatialUnitId + "/ownership",
          putBody
        ).subscribe({
          next: (response: any) => {
            this.successMessagePart = this.currentIndicatorDataset.indicatorName;
            this.broadcastService.broadcast('refreshIndicatorOverviewTable', { crudType: 'edit', targetIndicatorId: this.currentIndicatorDataset.indicatorId });
            this.showSuccessAlert();
            this.loadingData = false;
          },
          error: (error: any) => {
            this.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n";
            if (error.data) {
              this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error.data);
            } else {
              this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error);
            }
            this.showErrorAlert();
            this.loadingData = false;
          }
        });
      });
    }
  }

  executeRequest_indicatorSpatialUnitRoles(): void {
    let putBody = {
      "permissions": this.getSelectedRoleIds_roleManagementGrid(this.indicatorSpatialUnitGridApi),
      "isPublic": this.targetApplicableSpatialUnit.isPublic
    };

    this.loadingData = true;

    this.http.put(
      this.kommonitorIndicatorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + this.targetApplicableSpatialUnit.spatialUnitId + "/permissions",
      putBody
    ).subscribe({
      next: (response: any) => {
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { crudType: 'edit', targetIndicatorId: this.currentIndicatorDataset.indicatorId });
        this.showSuccessAlert();
        this.loadingData = false;
      },
      error: (error: any) => {
        this.errorMessagePart = "Fehler beim Aktualisieren der Zugriffsrechte auf Zeitreihe der Raumeinheit " + this.targetApplicableSpatialUnit.spatialUnitName + ". Fehler lautet: \n\n";
        if (error.data) {
          this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart += this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        this.loadingData = false;
      }
    });
  }

  onChangeSelectedSpatialUnit(targetApplicableSpatialUnit: any): void {
    console.log('onChangeSelectedSpatialUnit called with:', targetApplicableSpatialUnit);
    this.targetApplicableSpatialUnit = targetApplicableSpatialUnit;
    
    // Ensure access control data is loaded before refreshing
    if (!this.kommonitorIndicatorDataExchangeService.accessControl || this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
      this.loadAccessControlData().then(() => {
        this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
      });
    } else {
      this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
    }
  }

  // Multi-step form navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      
      // Ensure grids are refreshed when navigating to specific steps
      if (step === 2) {
        // Refresh step 2 grid when navigating to it
        setTimeout(() => {
          this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
        }, 100);
      } else if (step === 1) {
        // Refresh step 1 grid when navigating to it
        setTimeout(() => {
          this.refreshRoleManagementTable_indicatorMetadata();
        }, 100);
      }
    }
  }

  // AG Grid event handlers
  onIndicatorMetadataGridReady(event: GridReadyEvent): void {
    this.indicatorMetadataGridApi = event.api;
  }

  onIndicatorSpatialUnitGridReady(event: GridReadyEvent): void {
    console.log('onIndicatorSpatialUnitGridReady called');
    this.indicatorSpatialUnitGridApi = event.api;
    console.log('Spatial unit grid API set:', this.indicatorSpatialUnitGridApi);
    
    // Force refresh of the grid data if we have row data
    if (this.indicatorSpatialUnitRowData && this.indicatorSpatialUnitRowData.length > 0) {
      console.log('Setting row data to spatial unit grid:', this.indicatorSpatialUnitRowData);
      this.indicatorSpatialUnitGridApi.setRowData(this.indicatorSpatialUnitRowData);
    }
  }

  // Helper method to get selected role IDs from AG Grid
  private getSelectedRoleIds_roleManagementGrid(gridApi: GridApi): string[] {
    const selectedRoleIds: string[] = [];
    
    if (gridApi && gridApi.getRenderedNodes) {
      const rowData = gridApi.getRenderedNodes().map(node => node.data);
      
      rowData.forEach(row => {
        if (row.viewer && row.viewerPermissionId) {
          selectedRoleIds.push(row.viewerPermissionId);
        }
        if (row.editor && row.editorPermissionId) {
          selectedRoleIds.push(row.editorPermissionId);
        }
        if (row.creator && row.creatorPermissionId) {
          selectedRoleIds.push(row.creatorPermissionId);
        }
      });
    }
    
    return selectedRoleIds;
  }

  // Alert management
  showSuccessAlert(): void {
    $("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").show();
  }

  hideSuccessAlert(): void {
    $("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").hide();
  }

  showErrorAlert(): void {
    $("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
  }

  hideErrorAlert(): void {
    $("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").hide();
  }

  /**
   * Check if spatial unit grid should be enabled
   */
  isSpatialUnitGridEnabled(): boolean {
    return !!this.targetApplicableSpatialUnit && 
           !!this.kommonitorIndicatorDataExchangeService.accessControl &&
           this.kommonitorIndicatorDataExchangeService.accessControl.length > 0;
  }

  /**
   * Check if spatial unit grid has data
   */
  hasSpatialUnitGridData(): boolean {
    return this.indicatorSpatialUnitRowData && this.indicatorSpatialUnitRowData.length > 0;
  }

  /**
   * Get spatial unit grid data count
   */
  getSpatialUnitGridDataCount(): number {
    return this.indicatorSpatialUnitRowData ? this.indicatorSpatialUnitRowData.length : 0;
  }

  /**
   * Force refresh spatial unit grid data
   */
  forceSpatialUnitGridRefresh(): void {
    if (this.indicatorSpatialUnitGridApi && this.indicatorSpatialUnitRowData) {
      console.log('Force refreshing spatial unit grid with data:', this.indicatorSpatialUnitRowData);
      this.indicatorSpatialUnitGridApi.setRowData(this.indicatorSpatialUnitRowData);
      this.indicatorSpatialUnitGridApi.refreshCells({ force: true });
    }
  }

  /**
   * Temporarily disable filtering to show all data
   */
  showAllData(): void {
    console.log('Showing all data without filtering');
    this.activeConnectedRolesOnly = false;
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
  }
} 