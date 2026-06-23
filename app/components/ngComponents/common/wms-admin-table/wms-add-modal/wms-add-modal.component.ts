import { HttpClient } from '@angular/common/http';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColDef, ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { WmsDataset, WmsResourceType } from 'components/ngComponents/models/services.models';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import uuidv4 from '../../../../../../customizedExternalLibs/uuidv4.js';
import { AdminTopicsManagementComponent } from "components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component";
import { AgGridAngular } from "ag-grid-angular";
import { CommonModule } from '@angular/common';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';

@Component({
  selector: 'app-wms-add-modal',
  templateUrl: './wms-add-modal.component.html',
  styleUrls: ['./wms-add-modal.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, AdminTopicsManagementComponent, AgGridAngular, CommonModule],
  standalone: true
})
export class WmsAddModalComponent implements OnInit {
  
  @Input() resourceType!: any;

  totalSteps:number = 4;
  currentStep: number = 1;

  isSubmitting = false;
  errorMessage = false;
  successMessage = false;
  loadingData = false;
  
  testErrorMessage = false;
  testSuccessMessage = false;

  wmsTestStatus:boolean | undefined = undefined;

  metadataForm = new FormGroup({
    title: new FormControl<string>('', Validators.required),
    description: new FormControl<string>('', Validators.required),
    databasis: new FormControl<string>(''),
    datasource: new FormControl<string>('', Validators.required),
    contact: new FormControl<string>('', Validators.required),
    note: new FormControl<string>('')
  });

  connectForm = new FormGroup({
    url: new FormControl<string>('', Validators.required),
    layer: new FormControl<string>('', Validators.required)
  })

  datasetNameInvalid: boolean = false;
  
  // Topic hierarchy
  georesourceTopic_mainTopic: any = null;
  georesourceTopic_subTopic: any = null;
  georesourceTopic_subsubTopic: any = null;
  georesourceTopic_subsubsubTopic: any = null;

  availableTopics!: any;

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
    protected dataExchangeService: DataExchangeService,
    private ogcService: OgcService,
    protected roleManagementHelper: RoleManagementDataGridHelperService,
    protected envConfigService: EnvConfigService
  ) {}

  ngOnInit(): void {
    this.availableTopics = this.dataExchangeService.availableTopics.filter(e => e.topicResource==this.resourceType);
  }

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

  addWms() {

    let topicRef = this.georesourceTopic_mainTopic;
    
    if(this.georesourceTopic_subTopic)
      topicRef = this.georesourceTopic_subTopic;

    if(this.georesourceTopic_subsubTopic)
      topicRef = this.georesourceTopic_subsubTopic;

    if(this.georesourceTopic_subsubsubTopic)
      topicRef = this.georesourceTopic_subsubsubTopic;

    let data = {
      title: this.metadataForm.controls.title.value,
      description: this.metadataForm.controls.description.value,
      databasis: this.metadataForm.controls.databasis.value,
      datasource: this.metadataForm.controls.datasource.value,
      contact: this.metadataForm.controls.contact.value,
      note: this.metadataForm.controls.note.value,
      connectionDetails: {
        id: '',
        baseUrl: this.connectForm.controls.url.value,
        layerName: this.connectForm.controls.layer.value,
        serviceType: 'wms'
      },
      topicReference: topicRef.topicId,
      ownerId: this.ownerOrganization,
      serviceResource: this.resourceType,
      isPublic: this.isPublic,
      permissions: this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(this.roleManagementGridOptions)
    };

    this.ogcService.registerWms(data).subscribe({
      next: response => {
        this.successMessagePart = response.title;
        this.successMessage = true;
        this.resetWmsAddForm();
      }, 
      error: error => {
        this.errorMessagePart = error.message;
        this.errorMessage = true;
      }
    });
  }

  checkDatasetName() {

  }

  onChangeOwner(orgUnitId: string): void {
    this.ownerOrganization = orgUnitId;
    this.refreshRoles(orgUnitId);
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }
  
  private refreshRoles(orgUnitId:string): void {
    let permissionIds_ownerUnit: string[] = [];
    
    if (orgUnitId) {
      const accessControl = this.dataExchangeService.getAccessControlById(orgUnitId);
      permissionIds_ownerUnit = accessControl?.permissions
        ?.filter(permission => permission.permissionLevel === "viewer" || permission.permissionLevel === "editor")
        .map(permission => permission.permissionId) || [];
    }

    // Set datasetOwner flags
    this.dataExchangeService.accessControl?.forEach(item => {
      item.datasetOwner = item.organizationalUnitId === orgUnitId;
    });

    // Build the role management grid options
    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      '',
      this.roleManagementTableOptions,
      this.dataExchangeService.accessControl || [],
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

  resetWmsAddForm() {
    this.metadataForm.reset();
    this.connectForm.reset();

    this.georesourceTopic_mainTopic = null;
    this.georesourceTopic_subTopic = null;
    this.georesourceTopic_subsubTopic = null;
    this.georesourceTopic_subsubsubTopic = null;

    this.wmsTestStatus = undefined;

    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;

    this.currentStep = 1;
  }
  
  hideSuccessAlert(): void {
    this.successMessage = false;
    this.testSuccessMessage = false;
    this.successMessagePart = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = false;
    this.testErrorMessage = false;
    this.errorMessagePart = '';
  }

  testConnection() {

    this.testErrorMessage = false;
    this.testSuccessMessage = false;

    let url = this.connectForm.controls.url.value;
    let layer = this.connectForm.controls.layer.value;

    if(url && layer) {

      this.ogcService.testConnection(url).subscribe({
        next: response => {

          if(response.success===true)
            this.testSuccessMessage = true;
          else
            this.testErrorMessage = true;
        },
        error: error => {
          this.testErrorMessage = true;
        }
      })
    }
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
