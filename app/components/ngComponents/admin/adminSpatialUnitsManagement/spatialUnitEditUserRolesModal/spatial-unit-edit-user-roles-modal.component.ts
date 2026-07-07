import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  DestroyRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import {
  KommonitorDataExchangeService,
  SpatialUnitMetadata,
} from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { GridOptions, GridReadyEvent, ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

import { FormsModule } from '@angular/forms';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { getErrorMessage } from '../spatial-unit-import.util';
import {
  StepperComponent,
  StepperStep,
} from 'components/ngComponents/common/stepper/stepper.component';

@Component({
  selector: 'app-spatial-unit-edit-user-roles-modal',
  templateUrl: './spatial-unit-edit-user-roles-modal.component.html',
  styleUrls: ['./spatial-unit-edit-user-roles-modal.component.scss'],
  imports: [AgGridAngular, FormsModule, StepperComponent],
  standalone: true,
})
export class SpatialUnitEditUserRolesModalComponent implements OnInit, AfterViewInit {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  /** Emitted after roles/ownership changed so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

  private _currentSpatialUnitDataset: SpatialUnitMetadata | null = null;

  get currentSpatialUnitDataset(): SpatialUnitMetadata | null {
    return this._currentSpatialUnitDataset;
  }

  set currentSpatialUnitDataset(value: SpatialUnitMetadata | null) {
    this._currentSpatialUnitDataset = value;
    if (value) {
      // resetForm() already schedules the role-management table refresh, so we
      // must not trigger a second, redundant rebuild here.
      this.resetForm();
    }
  }
  roleManagementTableOptions: any = undefined;

  // ag-Grid properties
  roleManagementColumnDefs: ColDef[] = [];
  roleManagementRowData: any[] = [];
  roleManagementDefaultColDef: any = {};
  roleManagementGridOptions: GridOptions = {};
  roleManagementGridApi: any = null;

  ownerOrgFilter: string = '';
  ownerOrganization: string = '';
  activeRolesOnly: boolean = true;
  permissions: any[] = [];
  resourcesCreatorRights: any[] = [];

  loadingData: boolean = false;
  currentStep: number = 1;
  totalSteps: number = 2;
  steps: StepperStep[] = [{ label: 'Zugriffsschutz' }, { label: 'Eigentümerschaft' }];

  ngOnInit(): void {
    this.prepareCreatorList();
    this.loadAccessControlData();
  }

  ngAfterViewInit(): void {
    // Initialize grid if data is already available
    if (this.currentSpatialUnitDataset) {
      setTimeout(() => {
        this.refreshRoleManagementTable();
      }, 100);
    }
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
          if (role === 'unit-resources-creator' && !creatorRights.includes(key)) {
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
    creatorRightsChildren: string[],
    visited: Set<string> = new Set()
  ): void {
    // Guard against cyclic organisation hierarchies: never expand a node twice,
    // otherwise the recursion can loop indefinitely and overflow the stack.
    const toExpand = creatorRightsChildren.filter((name) => !visited.has(name));
    if (toExpand.length === 0) {
      return;
    }
    toExpand.forEach((name) => visited.add(name));

    this.kommonitorDataExchangeService.accessControl
      .filter((elem: any) => toExpand.includes(elem.name))
      .flatMap((res: any) => res.children)
      .forEach((child: any) => {
        this.kommonitorDataExchangeService.accessControl
          .filter((elem: any) => elem.organizationalUnitId === child)
          .forEach((childData: any) => {
            creatorRights.push(childData.name);
            this.gatherCreatorRightsChildren(creatorRights, [childData.name], visited);
          });
      });
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
    };
  }

  // Default column definition is now handled by the service

  // Grid options are now handled by the service with component-specific overrides

  onRoleManagementGridReady(params: GridReadyEvent): void {
    this.roleManagementGridApi = params.api;
    // Ensure helper service has the grid API to collect selected role IDs
    this.roleManagementHelper.setGridApi(params.api);
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

      // The [rowData]/[columnDefs] bindings already pushed the reassigned fields
      // to the grid; just force a re-render of the checkbox cell renderers.
      if (this.roleManagementGridApi && !this.roleManagementGridApi.isDestroyed()) {
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
      this.ownerOrganization = this.currentSpatialUnitDataset.ownerId ?? '';
      // Ensure the grid is initialized after a short delay to allow the view to be ready
      setTimeout(() => {
        this.refreshRoleManagementTable();
      }, 100);
    }

    this.ownerOrgFilter = '';
    this.currentStep = 1;
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

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  async editSpatialUnitUserRoles(): Promise<void> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    const ownershipChanging = this.isOwnershipChanging();
    if (ownershipChanging) {
      const confirmMessage =
        'Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?';
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    // Persist the permissions first. If that fails, abort: otherwise an
    // ownership transfer could succeed and mask the failure while the
    // permissions were never saved.
    const rolesSaved = await this.putUserRoles();
    if (!rolesSaved) {
      return;
    }

    // Only transfer ownership when it actually changed.
    if (ownershipChanging) {
      const ownershipSaved = await this.putOwnership();
      if (!ownershipSaved) {
        return;
      }
    }

    this.notificationService.showSuccess(
      `Zugriffsrechte für Raumebene "${dataset.spatialUnitLevel}" wurden aktualisiert.`
    );
    this.activeModal.close({
      action: 'updated',
      spatialUnitId: dataset.spatialUnitId,
    });
  }

  private async putUserRoles(): Promise<boolean> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return false;
    try {
      this.loadingData = true;

      const putBody = {
        permissions: this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
          this.roleManagementTableOptions
        ),
        isPublic: dataset.isPublic,
      };

      await this.http
        .put(
          `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${dataset.spatialUnitId}/permissions`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
        .toPromise();

      this.refreshRequested.emit({
        crudType: 'edit',
        targetSpatialUnitId: dataset.spatialUnitId,
      });
      // Persist latest selection locally so the grid reflects changes on refresh
      this.permissions = putBody.permissions;
      if (this.currentSpatialUnitDataset) {
        this.currentSpatialUnitDataset.permissions = putBody.permissions;
      }
      // Optionally refresh the table to sync checkbox state
      setTimeout(() => this.refreshRoleManagementTable(), 0);
      return true;
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler beim Aktualisieren der Zugriffsrechte: ' + getErrorMessage(error)
      );
      return false;
    } finally {
      this.loadingData = false;
    }
  }

  private async putOwnership(): Promise<boolean> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return false;
    try {
      this.loadingData = true;

      const putBody = {
        ownerId: this.ownerOrganization || dataset.ownerId,
      };

      await this.http
        .put(
          `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${dataset.spatialUnitId}/ownership`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
        .toPromise();

      this.refreshRequested.emit({
        crudType: 'edit',
        targetSpatialUnitId: dataset.spatialUnitId,
      });
      return true;
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler beim Aktualisieren der Eigentümerschaft: ' + getErrorMessage(error)
      );
      return false;
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
      this.ownerOrganization && this.ownerOrganization !== this.currentSpatialUnitDataset?.ownerId
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
      this.kommonitorDataExchangeService
        .fetchAccessControlMetadata(true)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (_data) => {
            // If we have data and a spatial unit dataset, refresh the table
            if (this.currentSpatialUnitDataset) {
              this.refreshRoleManagementTable();
            }
          },
          error: (_error) => {
            /* ignore */
          },
        });
    }
  }
}
