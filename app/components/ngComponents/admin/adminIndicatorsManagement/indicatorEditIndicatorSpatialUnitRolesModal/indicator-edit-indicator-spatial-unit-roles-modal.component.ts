import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { MultiStepHelperServiceService } from 'services/multi-step-helper-service/multi-step-helper-service.service';
import { HttpClient } from '@angular/common/http';

declare const $: any;

@Component({
  selector: 'app-indicator-edit-indicator-spatial-unit-roles-modal',
  templateUrl: './indicator-edit-indicator-spatial-unit-roles-modal.component.html',
  styleUrls: ['./indicator-edit-indicator-spatial-unit-roles-modal.component.css']
})
export class IndicatorEditIndicatorSpatialUnitRolesModalComponent implements OnInit {
  @ViewChild('modal') modal!: ElementRef;
  
  private modalRef?: NgbModalRef;
  
  // Form data
  currentIndicatorDataset: any;
  targetApplicableSpatialUnit: any;
  
  // Role management tables
  roleManagementTableOptions_indicatorMetadata: any;
  roleManagementTableOptions_indicatorSpatialUnitTimeseries: any;
  
  // Messages
  successMessagePart: string = '';
  errorMessagePart: string = '';
  
  // Form controls
  ownerOrgFilter: string = '';
  ownerOrganization: any;
  activeRolesOnly: boolean = true;
  activeConnectedRolesOnly: boolean = true;
  permissions: any[] = [];
  resourcesCreatorRights: any[] = [];
  
  // Loading states
  loadingData: boolean = false;
  
  // Multi-step form
  currentStep: number = 1;
  totalSteps: number = 3;
  
  constructor(
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    @Inject('kommonitorDataExchangeService') public angularJsDataExchangeService: any,
    @Inject('kommonitorDataGridHelperService') private angularJsDataGridHelperService: any,
    @Inject('kommonitorMultiStepFormHelperService') private angularJsMultiStepFormHelperService: any,
    private dataExchangeService: DataExchangeService,
    private dataGridHelperService: KommonitorIndicatorDataGridHelperService,
    private multiStepHelperService: MultiStepHelperServiceService
  ) {}

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeForm();
  }

  private setupEventListeners(): void {
    // Listen for edit indicator spatial unit roles event
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'onEditIndicatorSpatialUnitRoles') {
        this.openModal(data.values);
      } else if (data.msg === 'availableRolesUpdate') {
        this.refreshRoleManagementTable_indicatorMetadata();
        this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
      }
    });
  }

  private initializeForm(): void {
    this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
  }

  openModal(indicatorDataset: any): void {
    this.currentIndicatorDataset = indicatorDataset;
    this.prepareCreatorList();
    this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
    
    // Register the multi-step form handler
    this.angularJsMultiStepFormHelperService.registerClickHandler("indicatorEditIndicatorSpatialUnitRolesForm");
    
    // Show the modal using jQuery (since this is a legacy modal)
    $('#modal-edit-indicator-spatial-unit-roles').modal('show');
  }

  closeModal(): void {
    // Hide the modal using jQuery (since this is a legacy modal)
    $('#modal-edit-indicator-spatial-unit-roles').modal('hide');
  }

  prepareCreatorList(): void {
    if (this.angularJsDataExchangeService.currentKomMonitorLoginRoleNames.length > 0) {
      let creatorRights: string[] = [];
      let creatorRightsChildren: string[] = [];
      
      this.angularJsDataExchangeService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
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

      this.resourcesCreatorRights = this.angularJsDataExchangeService.accessControl.filter((elem: any) => creatorRights.includes(elem.name));
    }
  }

  gatherCreatorRightsChildren(creatorRights: string[], creatorRightsChildren: string[]): void {
    if (creatorRightsChildren.length > 0) {
      this.angularJsDataExchangeService.accessControl
        .filter((elem: any) => creatorRightsChildren.includes(elem.name))
        .flatMap((res: any) => res.children)
        .forEach((child: any) => {
          this.angularJsDataExchangeService.accessControl
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

  refreshRoleManagementTable_indicatorMetadata(): void {
    this.permissions = this.currentIndicatorDataset ? this.currentIndicatorDataset.permissions : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.angularJsDataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentIndicatorDataset) {
        if (item.organizationalUnitId == this.currentIndicatorDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    if (this.permissions.length == 0) {
      this.activeRolesOnly = false;
    }

    let access = this.angularJsDataExchangeService.accessControl;
    if (this.permissions.length > 0 && this.activeRolesOnly) {
      access = this.angularJsDataExchangeService.accessControl.filter((unit: any) => {
        return (unit.permissions.filter((unitPermission: any) => this.permissions.includes(unitPermission.permissionId)).length > 0 ? true : false);
      });
    }

    this.roleManagementTableOptions_indicatorMetadata = this.angularJsDataGridHelperService.buildRoleManagementGrid(
      'indicatorEditRoleManagementTable', 
      this.roleManagementTableOptions_indicatorMetadata, 
      access, 
      this.permissions, 
      true
    );
  }

  refreshRoleManagementTable_indicatorSpatialUnitTimeseries(): void {
    if (this.targetApplicableSpatialUnit && this.targetApplicableSpatialUnit.permissions) {
      if (this.targetApplicableSpatialUnit.permissions.length == 0) {
        this.activeConnectedRolesOnly = false;
      }

      let connectedAccess = this.angularJsDataExchangeService.accessControl;
      if (this.targetApplicableSpatialUnit.permissions.length > 0 && this.activeConnectedRolesOnly) {
        connectedAccess = this.angularJsDataExchangeService.accessControl.filter((unit: any) => {
          return (unit.permissions.filter((unitPermission: any) => this.targetApplicableSpatialUnit.permissions.includes(unitPermission.permissionId)).length > 0 ? true : false);
        });
      }

      this.roleManagementTableOptions_indicatorSpatialUnitTimeseries = this.angularJsDataGridHelperService.buildRoleManagementGrid(
        'indicatorEditIndicatorSpatialUnitsRoleManagementTable', 
        this.roleManagementTableOptions_indicatorSpatialUnitTimeseries, 
        connectedAccess, 
        this.targetApplicableSpatialUnit.permissions, 
        true
      );
    } else {
      this.activeConnectedRolesOnly = false;
      this.roleManagementTableOptions_indicatorSpatialUnitTimeseries = this.angularJsDataGridHelperService.buildRoleManagementGrid(
        'indicatorEditIndicatorSpatialUnitsRoleManagementTable', 
        this.roleManagementTableOptions_indicatorSpatialUnitTimeseries, 
        this.angularJsDataExchangeService.accessControl, 
        [], 
        true
      );
    }
  }

  onActiveConnectedRolesOnlyChange(): void {
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
  }

  onActiveRolesOnlyChange(): void {
    this.refreshRoleManagementTable_indicatorMetadata();
  }

  onChangeOwner(ownerOrganization: any): void {
    this.ownerOrganization = ownerOrganization;
    console.log("Target creator role selected to be:", this.ownerOrganization);
    this.refreshRoles(this.ownerOrganization);
  }

  refreshRoles(orgUnitId: string): void {
    let permissionIds_ownerUnit = orgUnitId ? 
      this.angularJsDataExchangeService.getAccessControlById(orgUnitId).permissions
        .filter((permission: any) => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor")
        .map((permission: any) => permission.permissionId) : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.angularJsDataExchangeService.accessControl.forEach((item: any) => {
      if (item.organizationalUnitId == orgUnitId) {
        item.datasetOwner = true;
      } else {
        item.datasetOwner = false;
      }
    });

    this.roleManagementTableOptions_indicatorMetadata = this.angularJsDataGridHelperService.buildRoleManagementGrid(
      'indicatorEditRoleManagementTable', 
      this.roleManagementTableOptions_indicatorMetadata, 
      this.angularJsDataExchangeService.accessControl, 
      permissionIds_ownerUnit, 
      true
    );
    
    this.roleManagementTableOptions_indicatorSpatialUnitTimeseries = this.angularJsDataGridHelperService.buildRoleManagementGrid(
      'indicatorEditIndicatorSpatialUnitsRoleManagementTable', 
      this.roleManagementTableOptions_indicatorSpatialUnitTimeseries, 
      this.angularJsDataExchangeService.accessControl, 
      permissionIds_ownerUnit, 
      true
    );
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
      "permissions": this.angularJsDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions_indicatorMetadata),
      "isPublic": this.currentIndicatorDataset.isPublic
    };

    this.http.put(
      this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/permissions",
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
          this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error);
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
      this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/ownership",
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
          this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error);
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
          this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + indicatorSpatialUnit.spatialUnitId + "/ownership",
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
              this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
            } else {
              this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error);
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
      "permissions": this.angularJsDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions_indicatorSpatialUnitTimeseries),
      "isPublic": this.targetApplicableSpatialUnit.isPublic
    };

    this.loadingData = true;

    this.http.put(
      this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + this.targetApplicableSpatialUnit.spatialUnitId + "/permissions",
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
          this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart += this.angularJsDataExchangeService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        this.loadingData = false;
      }
    });
  }

  onChangeSelectedSpatialUnit(targetApplicableSpatialUnit: any): void {
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
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
    }
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
} 