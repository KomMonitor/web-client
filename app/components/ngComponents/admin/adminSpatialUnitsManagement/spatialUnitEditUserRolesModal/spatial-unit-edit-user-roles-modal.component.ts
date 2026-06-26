import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { GridOptions, GridReadyEvent, ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-spatial-unit-edit-user-roles-modal',
  templateUrl: './spatial-unit-edit-user-roles-modal.component.html',
  styleUrls: ['./spatial-unit-edit-user-roles-modal.component.scss'],
  imports: [AgGridAngular, FormsModule],
  standalone: true,
})
export class SpatialUnitEditUserRolesModalComponent implements OnInit, OnDestroy, AfterViewInit {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);

  @ViewChild('progressbar', { static: true }) progressBar!: ElementRef;

  private _currentSpatialUnitDataset: any = null;

  get currentSpatialUnitDataset(): any {
    return this._currentSpatialUnitDataset;
  }

  set currentSpatialUnitDataset(value: any) {
    this._currentSpatialUnitDataset = value;
    if (value) {
      this.resetForm();
      // If access control data is available, refresh the table
      if (
        this.kommonitorDataExchangeService.accessControl &&
        this.kommonitorDataExchangeService.accessControl.length > 0
      ) {
        setTimeout(() => {
          this.refreshRoleManagementTable();
        }, 100);
      }
    }
  }
  roleManagementTableOptions: any = undefined;

  // ag-Grid properties
  roleManagementColumnDefs: ColDef[] = [];
  roleManagementRowData: any[] = [];
  roleManagementDefaultColDef: any = {};
  roleManagementGridOptions: GridOptions = {};
  roleManagementGridApi: any = null;

  successMessagePart: string = '';
  errorMessagePart: string = '';

  ownerOrgFilter: string = '';
  ownerOrganization: string = '';
  activeRolesOnly: boolean = true;
  permissions: any[] = [];
  resourcesCreatorRights: any[] = [];

  loadingData: boolean = false;
  currentStep: number = 1;
  totalSteps: number = 2;

  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.prepareCreatorList();
    this.setupBroadcastSubscription();
    this.loadAccessControlData();
  }

  ngAfterViewInit(): void {
    this.updateProgressBar();
    // Initialize grid if data is already available
    if (this.currentSpatialUnitDataset) {
      setTimeout(() => {
        this.refreshRoleManagementTable();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private setupBroadcastSubscription(): void {
    this.subscription.add(
      this.broadcastService.currentBroadcastMsg.subscribe((message: any) => {
        if (message.key === 'availableRolesUpdate') {
          this.refreshRoleManagementTable();
        }
      })
    );
  }

  prepareCreatorList(): void {
    if (this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.length > 0) {
      const creatorRights: string[] = [];
      const creatorRightsChildren: string[] = [];

      this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach(
        (roles: string) => {
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
        }
      );

      // gather all children
      this.gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

      this.resourcesCreatorRights = this.kommonitorDataExchangeService.accessControl.filter(
        (elem: any) => creatorRights.includes(elem.name)
      );
    }
  }

  private gatherCreatorRightsChildren(
    creatorRights: string[],
    creatorRightsChildren: string[]
  ): void {
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
    this.permissions = this.currentSpatialUnitDataset
      ? this.currentSpatialUnitDataset.permissions
      : [];

    // Check if accessControl data is available
    if (
      !this.kommonitorDataExchangeService.accessControl ||
      this.kommonitorDataExchangeService.accessControl.length === 0
    ) {
      return;
    }

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentSpatialUnitDataset) {
        if (item.organizationalUnitId === this.currentSpatialUnitDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    if (this.permissions.length === 0) {
      this.activeRolesOnly = false;
    }

    const access = this.kommonitorDataExchangeService.accessControl;
    // Do not filter access here; always pass the full array to the grid helper

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'spatialUnitEditRoleManagementTable',
      this.roleManagementTableOptions,
      access,
      this.permissions,
      true
    );

    // Extract column definitions and row data for ag-grid-angular
    if (this.roleManagementTableOptions) {
      this.roleManagementColumnDefs = this.roleManagementTableOptions.columnDefs || [];
      // Always get the full row data
      let allRows = this.roleManagementTableOptions.rowData || [];
      // If toggle is on, filter for at least one assigned right
      if (this.activeRolesOnly) {
        allRows = allRows.filter((row: any) => row.viewer || row.editor || row.creator);
      }
      this.roleManagementRowData = allRows;
      // Build grid configuration
      this.buildRoleManagementGridConfig();
    }
  }

  private buildRoleManagementGridConfig(): void {
    // Get base configuration from service
    this.roleManagementDefaultColDef = this.roleManagementHelper.buildRoleManagementDefaultColDef();

    // Get base grid options from service
    const baseGridOptions = this.roleManagementHelper.buildRoleManagementGridOptionsPublic(
      this.roleManagementTableOptions?.components
    );

    // Override with component-specific settings
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
      },
    };
  }

  // Default column definition is now handled by the service

  // Grid options are now handled by the service with component-specific overrides

  onRoleManagementGridReady(params: GridReadyEvent): void {
    this.roleManagementGridApi = params.api;
    // Ensure helper service has the grid API to collect selected role IDs
    this.roleManagementHelper.setGridApi(params.api);
  }

  onRoleManagementFirstDataRendered(_event: any): void {
    // Handle first data rendered event
  }

  onRoleManagementColumnResized(_event: any): void {
    // Handle column resized event
  }

  onActiveRolesOnlyChange(): void {
    this.refreshRoleManagementTable();
  }

  onChangeOwner(ownerOrganization: string): void {
    this.ownerOrganization = ownerOrganization;
    this.refreshRoles(this.ownerOrganization);
  }

  private refreshRoles(orgUnitId: string): void {
    const accessControl = this.kommonitorDataExchangeService.getAccessControlById(orgUnitId);
    const permissionIds_ownerUnit =
      orgUnitId && accessControl
        ? accessControl.permissions
            .filter(
              (permission: any) =>
                permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor'
            )
            .map((permission: any) => permission.permissionId)
        : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
      if (item.organizationalUnitId === orgUnitId) {
        item.datasetOwner = true;
      } else {
        item.datasetOwner = false;
      }
    });

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'spatialUnitEditRoleManagementTable',
      this.roleManagementTableOptions,
      this.kommonitorDataExchangeService.accessControl,
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
      if (this.roleManagementGridApi && !this.roleManagementGridApi.isDestroyed()) {
        // Update data
        this.roleManagementGridApi.setRowData(this.roleManagementRowData);
        this.roleManagementGridApi.setColumnDefs(this.roleManagementColumnDefs);

        // Refresh the grid to ensure it updates
        setTimeout(() => {
          if (this.roleManagementGridApi && !this.roleManagementGridApi.isDestroyed()) {
            this.roleManagementGridApi.refreshCells();
            this.roleManagementGridApi.redrawRows();
          }
        }, 100);
      }
    }
  }

  resetForm(): void {
    if (this.currentSpatialUnitDataset) {
      this.ownerOrganization = this.currentSpatialUnitDataset.ownerId;
      // Ensure the grid is initialized after a short delay to allow the view to be ready
      setTimeout(() => {
        this.refreshRoleManagementTable();
      }, 100);
    }

    this.ownerOrgFilter = '';
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.currentStep = 1;
    this.updateProgressBar();
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateProgressBar();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressBar();
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.updateProgressBar();
    }
  }

  private updateProgressBar(): void {
    if (this.progressBar && this.progressBar.nativeElement) {
      const steps = this.progressBar.nativeElement.querySelectorAll('li');
      steps.forEach((step: any, index: number) => {
        if (index < this.currentStep) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });
    }
  }

  async editSpatialUnitUserRoles(): Promise<void> {
    if (
      this.ownerOrganization &&
      this.ownerOrganization !== this.currentSpatialUnitDataset.ownerId
    ) {
      const confirmMessage =
        'Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?';
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    await this.putUserRoles();
    await this.putOwnership();
  }

  private async putUserRoles(): Promise<void> {
    try {
      this.loadingData = true;
      this.errorMessagePart = '';

      const putBody = {
        permissions: this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
          this.roleManagementTableOptions
        ),
        isPublic: this.currentSpatialUnitDataset.isPublic,
      };

      await this.http
        .put(
          `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/permissions`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
        .toPromise();

      this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
      this.broadcastService.broadcast(BroadcastMessage.RefreshSpatialUnitOverviewTable, [
        'edit',
        this.currentSpatialUnitDataset.spatialUnitId,
      ]);
      // Persist latest selection locally so the grid reflects changes on refresh
      this.permissions = putBody.permissions;
      if (this.currentSpatialUnitDataset) {
        this.currentSpatialUnitDataset.permissions = putBody.permissions;
      }
      // Optionally refresh the table to sync checkbox state
      setTimeout(() => this.refreshRoleManagementTable(), 0);
    } catch (error: any) {
      this.errorMessagePart = 'Fehler beim Aktualisieren der Zugriffsrechte. Fehler lautet: \n\n';
      if (error.error) {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(
          error.error
        );
      } else {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
    } finally {
      this.loadingData = false;
    }
  }

  private async putOwnership(): Promise<void> {
    try {
      this.loadingData = true;
      this.errorMessagePart = '';

      const putBody = {
        ownerId: this.ownerOrganization || this.currentSpatialUnitDataset.ownerId,
      };

      await this.http
        .put(
          `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/ownership`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
        .toPromise();

      this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
      this.broadcastService.broadcast(BroadcastMessage.RefreshSpatialUnitOverviewTable, [
        'edit',
        this.currentSpatialUnitDataset.spatialUnitId,
      ]);
    } catch (error: any) {
      this.errorMessagePart = 'Fehler beim Aktualisieren der Eigentümerschaft. Fehler lautet: \n\n';
      if (error.error) {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(
          error.error
        );
      } else {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
    } finally {
      this.loadingData = false;
    }
  }

  getCurrentOwnerName(): string {
    if (this.currentSpatialUnitDataset && this.currentSpatialUnitDataset.ownerId) {
      const owner = this.kommonitorDataExchangeService.getAccessControlById(
        this.currentSpatialUnitDataset.ownerId
      );
      return owner?.name || '';
    }
    return '';
  }

  isOwnershipChanging(): boolean {
    return !!(
      this.ownerOrganization && this.ownerOrganization !== this.currentSpatialUnitDataset.ownerId
    );
  }

  getFilteredOrganizations(): any[] {
    if (!this.ownerOrgFilter) {
      return this.kommonitorDataExchangeService.checkAdminPermission()
        ? this.kommonitorDataExchangeService.accessControl
        : this.resourcesCreatorRights;
    }

    const orgs = this.kommonitorDataExchangeService.checkAdminPermission()
      ? this.kommonitorDataExchangeService.accessControl
      : this.resourcesCreatorRights;

    return orgs.filter((org: any) =>
      org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
    );
  }

  hideSuccessAlert(): void {
    this.successMessagePart = '';
  }

  hideErrorAlert(): void {
    this.errorMessagePart = '';
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  // Method to initialize the component with data (called from parent)
  initializeWithData(spatialUnitDataset: any): void {
    this.currentSpatialUnitDataset = spatialUnitDataset;
    this.resetForm();
  }

  private loadAccessControlData(): void {
    // Check if access control data is already available
    if (
      this.kommonitorDataExchangeService.accessControl &&
      this.kommonitorDataExchangeService.accessControl.length > 0
    ) {
      // If we have data and a spatial unit dataset, refresh the table
      if (this.currentSpatialUnitDataset) {
        this.refreshRoleManagementTable();
      }
    } else {
      // Fetch access control data from server
      this.kommonitorDataExchangeService.fetchAccessControlMetadata(true).subscribe({
        next: (_data) => {
          // If we have data and a spatial unit dataset, refresh the table
          if (this.currentSpatialUnitDataset) {
            this.refreshRoleManagementTable();
          }
        },
        error: (_error) => {},
      });
    }
  }
}
