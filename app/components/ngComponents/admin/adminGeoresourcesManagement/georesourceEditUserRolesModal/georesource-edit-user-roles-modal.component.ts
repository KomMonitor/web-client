import { Component, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions, GridApi, ColumnApi, GridReadyEvent, FirstDataRenderedEvent, ColumnResizedEvent } from 'ag-grid-community';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare const __env: any;

@Component({
  selector: 'app-georesource-edit-user-roles-modal',
  templateUrl: './georesource-edit-user-roles-modal.component.html',
  styleUrls: ['./georesource-edit-user-roles-modal.component.css'],
  imports: [FormsModule, CommonModule, AgGridAngular],
  standalone: true
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

  // Current dataset being edited
  private _currentGeoresourceDataset: any;

  get currentGeoresourceDataset(): any {
    return this._currentGeoresourceDataset;
  }

  set currentGeoresourceDataset(value: any) {
    console.log('Setting currentGeoresourceDataset:', value);
    this._currentGeoresourceDataset = value;
    if (value) {
      setTimeout(() => {
        this.resetGeoresourceEditUserRolesForm();
        this.kommonitorMultiStepFormHelperService.registerClickHandler();
      }, 100);
    }
  }

  // Role management
  roleManagementTableOptions: GridOptions = {};
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
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorMultiStepFormHelperService') public kommonitorMultiStepFormHelperService: any,
    private roleManagementHelper: RoleManagementDataGridHelperService,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {
    console.log('GeoresourceEditUserRolesModalComponent constructor initialized');
  }

  ngOnInit(): void {
    console.log('GeoresourceEditUserRolesModalComponent ngOnInit');
    console.log('kommonitorDataExchangeService:', this.kommonitorDataExchangeService);
    console.log('accessControl:', this.kommonitorDataExchangeService?.accessControl);
    
    this.setupEventListeners();
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

  onEditGeoresourcesUserRoles(georesourceDataset: any): void {
    this.currentGeoresourceDataset = georesourceDataset;
    this.prepareCreatorList();
    this.resetGeoresourceEditUserRolesForm();
    this.kommonitorMultiStepFormHelperService?.registerClickHandler('georesourceEditUserRolesForm');
  }

  prepareCreatorList(): void {
    if (this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.length > 0) {
      const creatorRights: string[] = [];
      const creatorRightsChildren: string[] = [];
      
      this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
        const key = roles.split('.')[0];
        const role = roles.split('.')[1];

        // case unit-resources-creator
        if (role === 'unit-resources-creator' && !this.resourcesCreatorRights.includes(key)) {
          creatorRights.push(key);
        }

        // case client-resources-creator, gather unit-ids first, then fetch all unit-data
        if (role === 'client-resources-creator' && !creatorRightsChildren.includes(key)) {
          creatorRightsChildren.push(key);
        }
      });

      // gather all children
      this.gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

      this.resourcesCreatorRights = this.kommonitorDataExchangeService.accessControl.filter(
        (elem: any) => creatorRights.includes(elem.name)
      );
    }
  }

  private gatherCreatorRightsChildren(creatorRights: string[], creatorRightsChildren: string[]): void {
    if (creatorRightsChildren.length > 0) {
      this.kommonitorDataExchangeService.accessControl
        .filter((elem: any) => creatorRightsChildren.includes(elem.name))
        .flatMap((res: any) => res.children)
        .forEach((child: any) => {
          this.kommonitorDataExchangeService.accessControl
            .filter((elem: any) => elem.organizationalUnitId === child)
            .forEach((childData: any) => {
              creatorRights.push(childData.name);
              this.gatherCreatorRightsChildren(creatorRights, [childData.name]);
            });
        });
    }
  }

  refreshRoleManagementTable(): void {
    console.log('refreshRoleManagementTable called');
    console.log('currentGeoresourceDataset:', this.currentGeoresourceDataset);
    
    this.permissions = this.currentGeoresourceDataset ? this.currentGeoresourceDataset.permissions : [];
    console.log('permissions:', this.permissions);

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    if (this.kommonitorDataExchangeService.accessControl) {
      this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
        if (this.currentGeoresourceDataset) {
          if (item.organizationalUnitId === this.currentGeoresourceDataset.ownerId) {
            item.datasetOwner = true;
          } else {
            item.datasetOwner = false;
          }
        }
      });
    }

    if (this.permissions.length === 0) {
      this.activeRolesOnly = false;
    }

    let access = this.kommonitorDataExchangeService.accessControl || [];
    console.log('accessControl before filter:', access);
    
    if (this.permissions.length > 0 && this.activeRolesOnly) {
      access = this.kommonitorDataExchangeService.accessControl.filter((unit: any) => {
        return unit.permissions.filter((unitPermission: any) => 
          this.permissions.includes(unitPermission.permissionId)
        ).length > 0;
      });
    }
    
    console.log('accessControl after filter:', access);

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'georesourceEditRoleManagementTable', 
      this.roleManagementTableOptions, 
      access, 
      this.permissions, 
      true
    );
    
    console.log('roleManagementTableOptions created:', this.roleManagementTableOptions);
  }

  onActiveRolesOnlyChange(): void {
    this.activeRolesOnly = !this.activeRolesOnly;
    this.refreshRoleManagementTable();
  }

  onChangeOwner(ownerOrganization: any): void {
    this.ownerOrganization = ownerOrganization;
    console.log('Target creator role selected to be', this.ownerOrganization);
    this.refreshRoles(ownerOrganization);
  }

  private refreshRoles(orgUnitId: any): void {
    const permissionIds_ownerUnit = orgUnitId ? 
      this.kommonitorDataExchangeService.getAccessControlById(orgUnitId).permissions
        .filter((permission: any) => permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor')
        .map((permission: any) => permission.permissionId) : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
      if (item.organizationalUnitId === orgUnitId) {
        item.datasetOwner = true;
      } else {
        item.datasetOwner = false;
      }
    });

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'georesourceEditRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      permissionIds_ownerUnit, 
      true
    );
  }

  // Step navigation
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

  // AG Grid event handlers
  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    console.log('Role management grid is ready, API initialized');
  }

  onFirstDataRendered(_event: FirstDataRenderedEvent): void {
    // Handle first data rendered event
  }

  onColumnResized(_event: ColumnResizedEvent): void {
    // Handle column resize event
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

    const putBody = {
      permissions: this.getSelectedRoleIds(),
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
      next: (_response: any) => {
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
      next: (_response: any) => {
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
    this.refreshRoleManagementTable();
    this.ownerOrgFilter = '';
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.hideSuccessAlert();
    this.hideErrorAlert();

    setTimeout(() => {
      // Trigger change detection if needed
    }, 250);
  }

  // Helper methods
  getFilteredOrganizations(): any[] {
    if (!this.ownerOrgFilter) {
      return this.kommonitorDataExchangeService.accessControl || [];
    }
    return this.kommonitorDataExchangeService.accessControl?.filter((org: any) =>
      org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
    ) || [];
  }

  getFilteredCreatorRights(): any[] {
    if (!this.ownerOrgFilter) {
      return this.resourcesCreatorRights;
    }
    return this.resourcesCreatorRights.filter((org: any) =>
      org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
    );
  }

  getCurrentOwnerName(): string {
    if (this.currentGeoresourceDataset?.ownerId) {
      const owner = this.kommonitorDataExchangeService.getAccessControlById(this.currentGeoresourceDataset.ownerId);
      return owner ? owner.name : '';
    }
    return '';
  }

  // Helper method to get selected role IDs from the grid
  private getSelectedRoleIds(): string[] {
    const ids: string[] = [];
    const deselectedIds: string[] = [];
    
    if (this.gridApi) {
      this.gridApi.forEachNode((node: any, _index: number) => {
        if (node.data) {
          for (const permission of node.data.permissions) {
            if (permission) {
              if (permission.isChecked) {
                if (!deselectedIds.includes(permission.permissionId)) {
                  ids.push(permission.permissionId);
                }
              } else {
                deselectedIds.push(permission.permissionId);
              }
            }
          }
        }
      });
    }
    
    return ids;
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
} 