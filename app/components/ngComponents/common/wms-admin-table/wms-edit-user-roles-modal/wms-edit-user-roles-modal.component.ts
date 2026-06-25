import { HttpClient } from '@angular/common/http';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColDef, ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { forkJoin } from 'rxjs';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { AgGridAngular } from "ag-grid-angular";
import { CommonModule } from '@angular/common';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';

@Component({
  selector: 'app-wms-edit-user-roles-modal',
  templateUrl: './wms-edit-user-roles-modal.component.html',
  styleUrls: ['./wms-edit-user-roles-modal.component.scss'],
  imports: [AgGridAngular, FormsModule, CommonModule],
  standalone: true
})
export class WmsEditUserRolesModalComponent {

  currentGeoresourceDataset!: WmsDataset;

  totalSteps:number = 2;
  currentStep: number = 1;

  isSubmitting = false;
  errorMessage = false;
  successMessage = false;
  loadingData = false;
  
  // Role management
  roleManagementTableOptions: any = null;
  roleManagementColumnDefs: ColDef[] = [];
  roleManagementRowData: any[] = [];
  roleManagementDefaultColDef: ColDef = {};
  roleManagementGridOptions: GridOptions = {};
  roleManagementGridApi: GridApi | null = null;
  roleManagementColumnApi: ColumnApi | null = null;
  ownerOrganization = '';
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];

  successMessagePart = '';
  errorMessagePart = '';

  constructor(
    public activeModal: NgbActiveModal,
    protected accessControlService: AccessControlService,
    private ogcService: OgcService,
    protected roleManagementHelper: RoleManagementDataGridHelperService,
    protected envConfigService: EnvConfigService
  ) {}

  // Multi-step form navigation
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

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

  close(): void {
    this.activeModal.close(true);
  }

  reInit() {

    this.isPublic = this.currentGeoresourceDataset.isPublic;
    this.ownerOrganization = this.currentGeoresourceDataset.ownerId;

    // Build the role management grid options
    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      '',
      this.roleManagementTableOptions,
      this.accessControlService.accessControl || [],
      this.currentGeoresourceDataset.permissions,
      true
    );

    // Extract column definitions and row data for ag-grid-angular and rebuild grid config
    if (this.roleManagementTableOptions) {
      this.roleManagementColumnDefs = this.roleManagementTableOptions.columnDefs || [];
      this.roleManagementRowData = this.roleManagementTableOptions.rowData || [];
      
      // Build grid configuration (this will use the components from roleManagementTableOptions)
      this.buildRoleManagementGridConfig();
      
      // If grid is already initialized, update the data and grid options
      if (this.roleManagementGridApi) {
        // Update data
        this.roleManagementGridApi.setRowData(this.roleManagementRowData);
        this.roleManagementGridApi.setColumnDefs(this.roleManagementColumnDefs);
        
        // Refresh the grid to ensure it updates
        setTimeout(() => {
          if (this.roleManagementGridApi) {
            this.roleManagementGridApi.refreshCells();
            this.roleManagementGridApi.redrawRows();
          }
        }, 100);
      }
    }
  }

  editData() {

    let ownershipData = {
      ownerId: this.ownerOrganization
    } 
    
    let permissionData = {
      isPublic: this.isPublic,
      permissions: this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(this.roleManagementGridOptions)
    };

    forkJoin({
      ownership: this.ogcService.updateOwnership(this.currentGeoresourceDataset.id, ownershipData),
      permissions: this.ogcService.updatePermissions(this.currentGeoresourceDataset.id, permissionData)
    }).subscribe({
      next: (response:any) => {

        this.successMessagePart = this.currentGeoresourceDataset.title;
        this.successMessage = true;
      },
      error: error => {
        this.errorMessagePart = error.message;
        this.errorMessage = true;
      }
    });
  }

  onChangeOwner(orgUnitId: string): void {
    this.ownerOrganization = orgUnitId;
    //this.refreshRoles(orgUnitId);
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }
  
  private refreshRoles(orgUnitId:string): void {
    let permissionIds_ownerUnit: string[] = [];
    
    if (orgUnitId) {
      const accessControl = this.accessControlService.getAccessControlById(orgUnitId);
      permissionIds_ownerUnit = accessControl?.permissions
        ?.filter(permission => permission.permissionLevel === "viewer" || permission.permissionLevel === "editor")
        .map(permission => permission.permissionId) || [];
    }

    // Set datasetOwner flags
    this.accessControlService.accessControl?.forEach(item => {
      item.datasetOwner = item.organizationalUnitId === orgUnitId;
    });

    // Build the role management grid options
    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      '',
      this.roleManagementTableOptions,
      this.accessControlService.accessControl || [],
      permissionIds_ownerUnit,
      true
    );

    // Extract column definitions and row data for ag-grid-angular and rebuild grid config
    if (this.roleManagementTableOptions) {
      this.roleManagementColumnDefs = this.roleManagementTableOptions.columnDefs || [];
      this.roleManagementRowData = this.roleManagementTableOptions.rowData || [];
      
      // Build grid configuration (this will use the components from roleManagementTableOptions)
      this.buildRoleManagementGridConfig();
      
      // If grid is already initialized, update the data and grid options
      if (this.roleManagementGridApi) {
        // Update data
        this.roleManagementGridApi.setRowData(this.roleManagementRowData);
        this.roleManagementGridApi.setColumnDefs(this.roleManagementColumnDefs);
        
        // Refresh the grid to ensure it updates
        setTimeout(() => {
          if (this.roleManagementGridApi) {
            this.roleManagementGridApi.refreshCells();
            this.roleManagementGridApi.redrawRows();
          }
        }, 100);
      }
    }
  }

  resetWmsEditForm() {

    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;
  }
  
  hideSuccessAlert(): void {
    this.successMessage = false;
  }

  hideErrorAlert(): void {
    this.errorMessage = false;
  }

  onRoleManagementGridReady(params: any) {
    this.roleManagementGridApi = params.api;
    this.roleManagementColumnApi = params.columnApi;
    
    // Update the service with the grid API so it can be used for getSelectedRoleIds
    this.roleManagementHelper.setGridApi(params.api);
  }

  // Additional grid event handlers to match parent component
  onRoleManagementFirstDataRendered(event: any): void {
    this.roleManagementHeaderHeightSetter();
  }

  onRoleManagementColumnResized(event: any): void {
    this.roleManagementHeaderHeightSetter();
  }

  onRoleManagementModelUpdated(): void {
    // Grid model updated
  }

  onRoleManagementViewportChanged(): void {
    // Viewport changed
  }

  private roleManagementHeaderHeightSetter(): void {
    if (this.roleManagementGridApi) {
      const headerHeight = this.roleManagementHeaderHeightGetter();
      this.roleManagementGridApi.setHeaderHeight(headerHeight);
    }
  }

  private roleManagementHeaderHeightGetter(): number {
    const headerElement = document.querySelector('#roleManagementGrid .ag-header');
    if (headerElement) {
      const headerTextElements = headerElement.querySelectorAll('.ag-header-cell-text');
      let maxHeight = 0;
      headerTextElements.forEach(element => {
        const height = element.scrollHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      return Math.max(maxHeight + 20, 40); // Add padding and minimum height
    }
    return 40;
  }

  private buildRoleManagementGridConfig() {
    // Use service methods for base grid configuration
    this.roleManagementDefaultColDef = this.roleManagementHelper.buildRoleManagementDefaultColDef();
    const baseGridOptions = this.roleManagementHelper.buildRoleManagementGridOptionsPublic(
      this.roleManagementTableOptions?.components
    );
    
    // Apply component-specific overrides
    this.roleManagementGridOptions = {
      ...baseGridOptions,
      onGridReady: (params) => {
        this.onRoleManagementGridReady(params);
      },
      onFirstDataRendered: (event) => {
        this.onRoleManagementFirstDataRendered(event);
      },
      onColumnResized: (event) => {
        this.onRoleManagementColumnResized(event);
      }
    };
  }
}
