import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, ColumnApi, GridReadyEvent, FirstDataRenderedEvent, ColumnResizedEvent } from 'ag-grid-community';
import { KommonitorGeoresourceDataGridHelperService } from 'services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';
import { KommonitorGeoresourceDataExchangeService } from 'services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorMultiStepFormHelperService } from 'services/adminGeoresourceUnit/kommonitor-multi-step-form-helper.service';

declare const $: any;
declare const __env: any;

@Component({
  selector: 'georesource-edit-user-roles-modal-new',
  templateUrl: './georesource-edit-user-roles-modal.component.html',
  styleUrls: ['./georesource-edit-user-roles-modal.component.css']
})
export class GeoresourceEditUserRolesModalComponent implements OnInit, OnDestroy {
  @ViewChild('roleManagementTable', { static: true }) roleManagementTable!: AgGridAngular;

  // Multi-step form
  currentStep = 1;
  totalSteps = 2;

  // Form data
  loadingData = false;
  errorMessage = '';
  successMessage = '';
  
  // Track if access control data is available
  accessControlDataAvailable = false;

  // Current dataset being edited
  private _currentGeoresourceDataset: any;

  get currentGeoresourceDataset(): any {
    return this._currentGeoresourceDataset;
  }

  set currentGeoresourceDataset(value: any) {
    console.log('Setting currentGeoresourceDataset:', value);
    this._currentGeoresourceDataset = value;
  }

  // Role management
  roleManagementTableOptions: any = undefined;
  
  // ag-Grid properties (like spatial unit component)
  roleManagementColumnDefs: ColDef[] = [];
  roleManagementRowData: any[] = [];
  roleManagementDefaultColDef: any = {};
  roleManagementGridOptions: GridOptions = {};
  roleManagementGridApi: any = null;
  
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

  // Form fields
  activeRolesOnly = true;
  permissions: any[] = [];
  resourcesCreatorRights: any[] = [];
  ownerOrgFilter = '';
  ownerOrganization: any;

  // Messages
  successMessagePart = '';
  errorMessagePart = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    public kommonitorMultiStepFormHelperService: KommonitorMultiStepFormHelperService,
    private kommonitorDataGridHelperService: KommonitorGeoresourceDataGridHelperService,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {}

  async ngOnInit(): Promise<void> {
    this.setupEventListeners();
    
    // Load access control data first, then prepare creator list
    await this.loadAccessControlData();
    
    // Now prepare creator list since access control data should be available
    this.prepareCreatorList();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Setup broadcast listeners
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg) {
        if (broadcastMsg.msg === 'onEditGeoresourcesUserRoles') {
          this.onEditGeoresourcesUserRoles(broadcastMsg.values);
        } else if (broadcastMsg.msg === 'availableRolesUpdate') {
          this.refreshRoleManagementTable();
        }
      }
    });

    this.subscriptions.push(broadcastSubscription);
  }

  async onEditGeoresourcesUserRoles(georesourceDataset: any): Promise<void> {
    this.currentGeoresourceDataset = georesourceDataset;
    this.resetGeoresourceEditUserRolesForm();
    this.kommonitorMultiStepFormHelperService?.registerClickHandler('georesourceEditUserRolesForm');
    
    // Ensure access control data is loaded when the modal opens
    await this.ensureAccessControlDataLoaded();
  }

  prepareCreatorList(): void {
    console.log('Preparing creator list:', {
      hasAccessControl: !!this.kommonitorDataExchangeService.accessControl,
      accessControlLength: this.kommonitorDataExchangeService.accessControl?.length || 0,
      hasCurrentKomMonitorLoginRoleNames: !!this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames,
      currentKomMonitorLoginRoleNamesLength: this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames?.length || 0,
      currentKomMonitorLoginRoleNames: this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames
    });
    
    // Ensure access control data is available (like AngularJS component expects)
    if (!this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      console.warn('No access control data available for preparing creator list');
      return;
    }
    
    // Match AngularJS pattern: check if roles exist and process them
    if (this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames?.length > 0) {
      const creatorRights: string[] = [];
      const creatorRightsChildren: string[] = [];
      
      this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
        const key = roles.split('.')[0];
        const role = roles.split('.')[1];

        // case unit-resources-creator
        if (role === 'unit-resources-creator' && !creatorRights.includes(key)) {
          creatorRights.push(key);
        }

        // case client-resources-creator, gather unit-ids first, then fetch all unit-data
        if (role === 'client-resources-creator' && !creatorRightsChildren.includes(key)) {
          creatorRightsChildren.push(key);
        }
      });

      console.log('Creator rights processing:', {
        creatorRights: creatorRights,
        creatorRightsChildren: creatorRightsChildren
      });

      // gather all children
      this.gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

      this.resourcesCreatorRights = this.kommonitorDataExchangeService.accessControl?.filter(
        (elem: any) => creatorRights.includes(elem.name)
      ) || [];
      
      console.log('Final resources creator rights:', {
        count: this.resourcesCreatorRights.length,
        resourcesCreatorRights: this.resourcesCreatorRights.map(org => ({ id: org.organizationalUnitId, name: org.name }))
      });
    } else {
      console.warn('No current KomMonitor login role names available - using all access control data as fallback');
      // Fallback: use all access control data if no specific creator rights are available
      // This ensures the dropdown shows organizations even for users without specific creator roles
      this.resourcesCreatorRights = this.kommonitorDataExchangeService.accessControl || [];
      
      console.log('Using fallback resources creator rights (all access control data):', {
        count: this.resourcesCreatorRights.length,
        resourcesCreatorRights: this.resourcesCreatorRights.map(org => ({ id: org.organizationalUnitId, name: org.name }))
      });
    }
  }

  private gatherCreatorRightsChildren(creatorRights: string[], creatorRightsChildren: string[]): void {
    if (creatorRightsChildren.length > 0) {
      this.kommonitorDataExchangeService.accessControl
        ?.filter((elem: any) => creatorRightsChildren.includes(elem.name))
        .flatMap((res: any) => res.children || [])
        .forEach((child: any) => {
          this.kommonitorDataExchangeService.accessControl
            ?.filter((elem: any) => elem.organizationalUnitId === child)
            .forEach((childData: any) => {
              creatorRights.push(childData.name);
              this.gatherCreatorRightsChildren(creatorRights, [childData.name]);
            });
        });
    }
  }

  refreshRoleManagementTable(): void {
    this.permissions = this.currentGeoresourceDataset ? this.currentGeoresourceDataset.permissions : [];

    // Check if accessControl data is available
    if (!this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      return;
    }

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    // Consider both current owner and selected new owner
    const effectiveOwnerId = this.ownerOrganization !== undefined ? this.ownerOrganization : this.currentGeoresourceDataset?.ownerId;
    
    this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
      if (effectiveOwnerId) {
        if (item.organizationalUnitId === effectiveOwnerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    console.log('Refreshing role management table:', {
      currentOwnerId: this.currentGeoresourceDataset?.ownerId,
      selectedNewOwnerId: this.ownerOrganization,
      effectiveOwnerId: effectiveOwnerId,
      permissions: this.permissions,
      permissionsCount: this.permissions?.length || 0,
      accessControlCount: this.kommonitorDataExchangeService.accessControl.length
    });

    // Match AngularJS logic: only reset if no permissions
    if (this.permissions.length === 0) {
      this.activeRolesOnly = false;
    }

    // Apply filtering based on activeRolesOnly toggle
    let access = this.kommonitorDataExchangeService.accessControl;
    
    if (this.activeRolesOnly && this.permissions.length > 0) {
      // Filter to show only units that have at least one permission assigned
      access = this.kommonitorDataExchangeService.accessControl.filter((unit: any) => {
        // Check if this unit has any of the current permissions
        return unit.permissions?.some((unitPermission: any) => 
          this.permissions.includes(unitPermission.permissionId)
        ) || false;
      });
      
      console.log('Filtered access control for active roles only:', {
        originalCount: this.kommonitorDataExchangeService.accessControl.length,
        filteredCount: access.length,
        filteredUnits: access.map((u: any) => u.name)
      });
    }

    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceEditRoleManagementTable',
      this.roleManagementTableOptions,
      access,
      this.permissions
    );

    // Extract column definitions and row data for ag-grid-angular
    if (this.roleManagementTableOptions) {
      this.roleManagementColumnDefs = this.roleManagementTableOptions.columnDefs || [];
      // Get the row data (already filtered by the grid helper if activeRolesOnly is true)
      this.roleManagementRowData = this.roleManagementTableOptions.rowData || [];
      
      // Log the user role data that will be rendered in the data grid
      console.log('User Role Data for Data Grid:', {
        rowData: this.roleManagementRowData,
        columnDefs: this.roleManagementColumnDefs,
        permissions: this.permissions,
        accessControl: access,
        activeRolesOnly: this.activeRolesOnly,
        roleManagementTableOptions: this.roleManagementTableOptions
      });
      
      // Build grid configuration
      this.buildRoleManagementGridConfig();
    }
  }

  onActiveRolesOnlyChange(): void {
    // The toggle component handles its own state, so we don't need to reverse it
    // Just refresh the table with the new filter setting
    console.log('Active roles only toggle changed:', {
      activeRolesOnly: this.activeRolesOnly,
      permissions: this.permissions,
      accessControlLength: this.kommonitorDataExchangeService.accessControl?.length || 0
    });

    // Refresh the table with the new filter setting
    this.refreshRoleManagementTable();
  }

  onChangeOwner(ownerOrganization: any): void {
    this.ownerOrganization = ownerOrganization;
    
    console.log('Owner changed:', {
      newOwnerId: ownerOrganization,
      currentOwnerId: this.currentGeoresourceDataset?.ownerId,
      activeRolesOnly: this.activeRolesOnly,
      permissions: this.permissions,
      permissionsCount: this.permissions?.length || 0
    });
    
    // Refresh the roles list to show current dataset permissions
    this.refreshRoles(ownerOrganization);
    
    // Also refresh the main role management table to ensure consistency
    this.refreshRoleManagementTable();
  }

  onOwnerOrgFilterChange(): void {
    console.log('Owner organization filter changed:', {
      filter: this.ownerOrgFilter,
      activeRolesOnly: this.activeRolesOnly
    });
    
    // The filtering is handled by the getFilteredOrganizations() method in the template
    // No need to refresh the table here as it's just a display filter
  }

  onPublicPrivateChange(): void {
    console.log('Public/Private toggle changed:', {
      isPublic: this.currentGeoresourceDataset?.isPublic,
      activeRolesOnly: this.activeRolesOnly
    });
    
    // Don't refresh the table here - the public/private setting doesn't affect the role management table
    // Only refresh if we need to update other parts of the UI
  }

  // Method to handle when permissions change (e.g., when roles are added/removed)
  onPermissionsChanged(): void {
    console.log('Permissions changed:', {
      permissions: this.permissions,
      activeRolesOnly: this.activeRolesOnly
    });
    
    // Refresh the table to reflect permission changes
    this.refreshRoleManagementTable();
  }

  private refreshRoles(orgUnitId: any): void {
    const accessControl = this.kommonitorDataExchangeService.getAccessControlById(orgUnitId);
    
    // Use the current dataset's permissions, not the new owner's permissions
    // This ensures users can still see and manage the current dataset's roles
    const permissionIds_toUse = this.permissions || [];

    console.log('Refreshing roles for ownership change:', {
      newOwnerId: orgUnitId,
      currentPermissions: this.permissions,
      permissionIds_toUse: permissionIds_toUse,
      accessControlCount: this.kommonitorDataExchangeService.accessControl?.length || 0
    });

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorDataExchangeService.accessControl?.forEach((item: any) => {
      if (item.organizationalUnitId === orgUnitId) {
        item.datasetOwner = true;
      } else {
        item.datasetOwner = false;
      }
    });

    // Apply the same filtering logic as refreshRoleManagementTable
    let access = this.kommonitorDataExchangeService.accessControl || [];
    
    if (this.activeRolesOnly && this.permissions.length > 0) {
      // Filter to show only units that have at least one permission assigned
      access = this.kommonitorDataExchangeService.accessControl.filter((unit: any) => {
        // Check if this unit has any of the current permissions
        return unit.permissions?.some((unitPermission: any) => 
          this.permissions.includes(unitPermission.permissionId)
        ) || false;
      });
    }

    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceEditRoleManagementTable',
      this.roleManagementTableOptions,
      access,
      permissionIds_toUse  // Use current dataset permissions, not new owner permissions
    );

    // Extract column definitions and row data for ag-grid-angular and rebuild grid config
    if (this.roleManagementTableOptions) {
      this.roleManagementColumnDefs = this.roleManagementTableOptions.columnDefs || [];
      this.roleManagementRowData = this.roleManagementTableOptions.rowData || [];
      
      console.log('Updated role management data:', {
        columnDefs: this.roleManagementColumnDefs.length,
        rowData: this.roleManagementRowData.length,
        sampleRowData: this.roleManagementRowData.slice(0, 2)
      });
      
      // Build grid configuration (this will use the components from roleManagementTableOptions)
      this.buildRoleManagementGridConfig();
      
      // If grid is already initialized, update the data and grid options
      if (this.roleManagementGridApi && !this.roleManagementGridApi.isDestroyed()) {
        // Update data
        this.roleManagementGridApi.setRowData(this.roleManagementRowData);
        this.roleManagementGridApi.setColumnDefs(this.roleManagementColumnDefs);
        
        // Refresh the grid to ensure it updates
        setTimeout(() => {
          if (this.roleManagementGridApi && !this.roleManagementGridApi.isDestroyed()) {
            this.roleManagementGridApi.refreshCells();
            this.roleManagementGridApi.redrawRows();
            
            console.log('Grid updated with new data for ownership change');
          }
        }, 100);
      }
    }
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      // Ensure roles list is up to date when moving to next step
      this.ensureRolesListUpToDate();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      // Ensure roles list is up to date when moving to previous step
      this.ensureRolesListUpToDate();
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      // Ensure roles list is up to date when changing steps
      this.ensureRolesListUpToDate();
    }
  }

  // Ensure that the roles list is properly updated when navigating between steps
  private ensureRolesListUpToDate(): void {
    // If we're on step 1 (Zugriffsschutz) and ownership has changed, refresh the roles list
    if (this.currentStep === 1 && this.ownerOrganization !== this.currentGeoresourceDataset?.ownerId) {
      console.log('Ensuring roles list is up to date for step 1 after ownership change');
      this.refreshRoleManagementTable();
    }
    
    // If we're on step 2 (Eigentümerschaft), ensure access control data is loaded
    if (this.currentStep === 2) {
      console.log('Ensuring access control data is loaded for step 2');
      this.ensureAccessControlDataLoaded();
    }
  }

  // Ensure access control data is loaded for the dropdown
  private async ensureAccessControlDataLoaded(): Promise<void> {
    if (!this.accessControlDataAvailable || !this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      console.log('Access control data not available, loading it now...');
      await this.loadAccessControlData();
      
      // After loading, prepare creator list again
      this.prepareCreatorList();
    }
  }

  // Handle checkbox changes
  onCellValueChanged(event: any): void {
    if (event.colDef.field === 'viewer' || event.colDef.field === 'editor' || event.colDef.field === 'creator') {
      // Update the row data
      const rowData = event.data;
      const field = event.colDef.field;
      rowData[field] = event.newValue;
      
      // Update the grid options row data to keep it in sync
      if (this.roleManagementTableOptions && this.roleManagementTableOptions.rowData) {
        const gridRow = this.roleManagementTableOptions.rowData.find((row: any) => row.organizationalUnitId === rowData.organizationalUnitId);
        if (gridRow) {
          gridRow[field] = event.newValue;
        }
      }
    }
  }

  // Form actions
  editGeoresourceEditUserRolesForm(): void {
    if (this.ownerOrganization !== undefined && this.ownerOrganization !== this.currentGeoresourceDataset.ownerId) {
      if (!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?')) {
        return;
      }
    }

    this.putUserRoles();
    this.putOwnership();
  }

  putUserRoles(): void {
    this.loadingData = true;

    const selectedRoleIds = this.getSelectedRoleIds();
    
    console.log('Putting user roles:', {
      selectedRoleIds: selectedRoleIds,
      selectedRoleIdsCount: selectedRoleIds.length,
      currentPermissions: this.permissions,
      currentPermissionsCount: this.permissions?.length || 0,
      ownerOrganization: this.ownerOrganization,
      currentOwnerId: this.currentGeoresourceDataset?.ownerId,
      isOwnershipChanging: this.ownerOrganization !== this.currentGeoresourceDataset?.ownerId
    });

    const putBody = {
      permissions: selectedRoleIds,
      isPublic: this.currentGeoresourceDataset.isPublic
    };

    this.http.put(
      `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/permissions`,
      putBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).subscribe({
      next: (response: any) => {
        console.log('User roles updated successfully:', response);
        this.successMessagePart = this.currentGeoresourceDataset.datasetName;
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', {
          crudType: 'edit',
          targetGeoresourceId: this.currentGeoresourceDataset.georesourceId
        });
        this.showSuccessAlert();
        setTimeout(() => {
          this.loadingData = false;
        }, 250);
      },
      error: (error: any) => {
        console.error('Error updating user roles:', error);
        this.errorMessagePart = 'Fehler beim Aktualisieren der Zugriffsrechte. Fehler lautet: \n\n';
        if (error.data) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        setTimeout(() => {
          this.loadingData = false;
        }, 250);
      }
    });
  }

  putOwnership(): void {
    this.loadingData = true;

    const putBody = {
      ownerId: this.ownerOrganization === undefined ? this.currentGeoresourceDataset.ownerId : this.ownerOrganization
    };

    this.http.put(
      `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/ownership`,
      putBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).subscribe({
      next: (response: any) => {
        this.successMessagePart = this.currentGeoresourceDataset.datasetName;
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', {
          crudType: 'edit',
          targetGeoresourceId: this.currentGeoresourceDataset.georesourceId
        });
        this.showSuccessAlert();
        setTimeout(() => {
          this.loadingData = false;
        }, 250);
      },
      error: (error: any) => {
        this.errorMessagePart = 'Fehler beim Aktualisieren der Eigentümerschaft. Fehler lautet: \n\n';
        if (error.data) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        setTimeout(() => {
          this.loadingData = false;
        }, 250);
      }
    });
  }

  resetGeoresourceEditUserRolesForm(): void {
    this.ownerOrganization = this.currentGeoresourceDataset?.ownerId;
    this.ownerOrgFilter = '';
    this.activeRolesOnly = false; // Reset the toggle to false
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.hideSuccessAlert();
    this.hideErrorAlert();
    
    console.log('Form reset - activeRolesOnly set to false');
    
    // Refresh the table after resetting the toggle
    this.refreshRoleManagementTable();
  }

  // Helper methods
  getFilteredOrganizations(): any[] {
    console.log('Getting filtered organizations:', {
      accessControlDataAvailable: this.accessControlDataAvailable,
      hasAccessControl: !!this.kommonitorDataExchangeService.accessControl,
      accessControlLength: this.kommonitorDataExchangeService.accessControl?.length || 0,
      ownerOrgFilter: this.ownerOrgFilter
    });
    
    // Return empty array silently if data is not available (template-safe)
    if (!this.accessControlDataAvailable || !this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      console.log('No organizations available - returning empty array');
      return [];
    }
    
    const organizations = !this.ownerOrgFilter ? 
      this.kommonitorDataExchangeService.accessControl :
      this.kommonitorDataExchangeService.accessControl.filter((org: any) =>
        org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
      );
    
    console.log('Returning organizations:', {
      count: organizations.length,
      organizations: organizations.map(org => ({ id: org.organizationalUnitId, name: org.name }))
    });
    
    return organizations;
  }

  getFilteredCreatorRights(): any[] {
    console.log('Getting filtered creator rights:', {
      accessControlDataAvailable: this.accessControlDataAvailable,
      hasAccessControl: !!this.kommonitorDataExchangeService.accessControl,
      accessControlLength: this.kommonitorDataExchangeService.accessControl?.length || 0,
      resourcesCreatorRightsLength: this.resourcesCreatorRights?.length || 0,
      ownerOrgFilter: this.ownerOrgFilter
    });
    
    // Return empty array silently if data is not available (template-safe)
    if (!this.accessControlDataAvailable || !this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      console.log('No creator rights available - returning empty array');
      return [];
    }
    
    const creatorRights = !this.ownerOrgFilter ? 
      this.resourcesCreatorRights :
      this.resourcesCreatorRights.filter((org: any) =>
        org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
      );
    
    console.log('Returning creator rights:', {
      count: creatorRights.length,
      creatorRights: creatorRights.map(org => ({ id: org.organizationalUnitId, name: org.name }))
    });
    
    return creatorRights;
  }

  getCurrentOwnerName(): string {
    // Return empty string silently if data is not available (template-safe)
    if (!this.accessControlDataAvailable || !this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      return '';
    }
    
    if (this.currentGeoresourceDataset?.ownerId) {
      const owner = this.kommonitorDataExchangeService.getAccessControlById(this.currentGeoresourceDataset.ownerId);
      return owner ? owner.name : '';
    }
    return '';
  }

  // Helper method to get selected role IDs from the grid
  private getSelectedRoleIds(): string[] {
    const selectedIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
    
    console.log('Getting selected role IDs:', {
      selectedIds: selectedIds,
      selectedIdsCount: selectedIds.length,
      roleManagementTableOptions: this.roleManagementTableOptions,
      hasRowData: !!this.roleManagementTableOptions?.rowData,
      rowDataCount: this.roleManagementTableOptions?.rowData?.length || 0,
      sampleRowData: this.roleManagementTableOptions?.rowData?.slice(0, 2) || []
    });
    
    return selectedIds;
  }

  // Alert methods
  showSuccessAlert(): void {
    this.successMessage = 'Zugriffsschutz und Eigentümerschaft erfolgreich aktualisiert';
    setTimeout(() => this.hideSuccessAlert(), 5000);
  }

  hideSuccessAlert(): void {
    this.successMessage = '';
  }

  showErrorAlert(): void {
    setTimeout(() => this.hideErrorAlert(), 10000);
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
    this.errorMessagePart = '';
  }

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }

  // Grid configuration methods (like spatial unit component)
  private buildRoleManagementGridConfig(): void {
    this.roleManagementDefaultColDef = this.buildRoleManagementDefaultColDef();
    this.roleManagementGridOptions = this.buildRoleManagementGridOptions();
  }

  private buildRoleManagementDefaultColDef(): any {
    return {
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
        'padding-bottom': '17px' 
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
    };
  }

  private buildRoleManagementGridOptions(): GridOptions {
    // Use components from the table options if available
    const components = this.roleManagementTableOptions?.components || {};

    return {
      components: components,
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      headerHeight: 40,
      rowHeight: 35,
      onGridReady: (params) => {
        this.onRoleManagementGridReady(params);
        // Add cell value changed event listener for checkboxes
        if (params.api) {
          params.api.addEventListener('cellValueChanged', this.onCellValueChanged.bind(this));
        }
      },
      onFirstDataRendered: (event) => {
        this.onRoleManagementFirstDataRendered(event);
      },
      onColumnResized: (event) => {
        this.onRoleManagementColumnResized(event);
      }
    };
  }

  onRoleManagementGridReady(params: GridReadyEvent): void {
    this.roleManagementGridApi = params.api;
  }

  onRoleManagementFirstDataRendered(event: any): void {
    // Handle first data rendered event
  }

  onRoleManagementColumnResized(event: any): void {
    // Handle column resized event
  }

  private async loadAccessControlData(): Promise<void> {
    // Check if access control data is already available
    if (this.kommonitorDataExchangeService.accessControl && this.kommonitorDataExchangeService.accessControl.length > 0) {
      // Set flag to true since we have data
      this.accessControlDataAvailable = true;
      console.log('Access control data already available:', {
        accessControlCount: this.kommonitorDataExchangeService.accessControl.length,
        accessControlDataAvailable: this.accessControlDataAvailable
      });
      
      // If we have data and a georesource dataset, refresh the table
      if (this.currentGeoresourceDataset) {
        this.refreshRoleManagementTable();
      }
    } else {
      // Fetch access control data from server
      try {
        console.log('Fetching access control data from server...');
        await this.kommonitorDataExchangeService.fetchAccessControlMetadata();
        
        // Check if we successfully got data
        if (this.kommonitorDataExchangeService.accessControl && this.kommonitorDataExchangeService.accessControl.length > 0) {
          this.accessControlDataAvailable = true;
          console.log('Access control data loaded successfully:', {
            accessControlCount: this.kommonitorDataExchangeService.accessControl.length,
            accessControlDataAvailable: this.accessControlDataAvailable
          });
        } else {
          console.warn('No access control data received from server');
          this.accessControlDataAvailable = false;
        }
        
        // If we have data and a georesource dataset, refresh the table
        if (this.currentGeoresourceDataset) {
          this.refreshRoleManagementTable();
        }
      } catch (error) {
        console.error('Error fetching access control data:', error);
        this.accessControlDataAvailable = false;
      }
    }
  }

  // Debug methods for template
  getDebugInfo(): any {
    return {
      accessControlDataAvailable: this.accessControlDataAvailable,
      adminPermission: this.kommonitorDataExchangeService.checkAdminPermission(),
      accessControlCount: this.kommonitorDataExchangeService.accessControl?.length || 0,
      resourcesCreatorRightsCount: this.resourcesCreatorRights?.length || 0,
      filteredOrganizationsCount: this.getFilteredOrganizations()?.length || 0,
      filteredCreatorRightsCount: this.getFilteredCreatorRights()?.length || 0,
      ownerOrgFilter: this.ownerOrgFilter,
      hasAccessControl: !!this.kommonitorDataExchangeService.accessControl
    };
  }

  getSampleOrganizations(): string {
    const orgs = this.getFilteredOrganizations();
    if (!orgs || orgs.length === 0) {
      return 'None';
    }
    return orgs.slice(0, 3).map(org => org.name).join(', ');
  }
} 