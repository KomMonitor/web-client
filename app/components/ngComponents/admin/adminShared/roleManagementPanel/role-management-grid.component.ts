import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { collectSelectedRoleIds, ownerDefaultPermissionIds } from './role-management-panel.model';

/**
 * The role-/permission-assignment grid shared by the admin resource modals:
 * one organizational unit per row, viewer/editor(/creator) checkboxes per
 * column, optional "only assigned roles" switch.
 *
 * Replaces the per-modal copies of the grid-building code around
 * `RoleManagementDataGridHelperService`. Unlike those copies, this component
 * owns its grid API (instead of the shared one on the root-provided helper)
 * and computes the owner flags on a copy of the access-control list (instead
 * of mutating the shared array), so two open grids cannot clobber each other.
 *
 * NOTE: place it under `[style.display]` step switching, not `@if` — the
 * checked state lives in this component's row data and would be lost if the
 * component were destroyed between steps.
 */
@Component({
  selector: 'app-role-management-grid',
  templateUrl: './role-management-grid.component.html',
  imports: [TranslateModule, AgGridAngular, FormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleManagementGridComponent implements OnInit, OnChanges {
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private accessControlService = inject(AccessControlService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  /** Permission ids that are initially checked. */
  @Input() permissions: string[] | null | undefined = [];
  /** Organizational unit owning the dataset; its row is checked and disabled. */
  @Input() ownerId: string | null | undefined = null;
  /** Hide the creator ("Löschen") column. Default matches the edit modals. */
  @Input() reducedColumns = true;
  /** Show the "Zeige nur zugewiesene Rechte" switch. */
  @Input() showActiveRolesOnlyToggle = false;
  /** Nominal grid id handed to the grid helper (unique per usage). */
  @Input() gridId = 'roleManagementPanelGrid';

  // Signal-backed because rebuild() also runs from async paths (access-control
  // fetch) and from host components calling applyOwner()/applyPermissions()
  // via @ViewChild — plain fields would not re-render under OnPush.
  activeRolesOnly = signal(true);

  columnDefs = signal<ColDef[]>([]);
  rowData = signal<AccessControlMetadata[]>([]);
  readonly components = this.roleManagementHelper.getRoleManagementComponents();
  readonly defaultColDef: ColDef = this.roleManagementHelper.buildRoleManagementDefaultColDef();
  readonly gridOptions = this.roleManagementHelper.buildRoleManagementGridOptionsPublic(
    this.components
  );

  private gridApi: GridApi | null = null;
  private tableOptions: { rowData?: AccessControlMetadata[]; columnDefs?: ColDef[] } | null = null;
  /** Working selection; reseeded by applyOwner(), otherwise mirrors `permissions`. */
  private selectedPermissionIds: string[] = [];
  /** Owner whose row is disabled; updated by applyOwner(). */
  private currentOwnerId: string | null | undefined = null;

  ngOnInit(): void {
    this.ensureAccessControlLoaded();
    // Re-translate the helper-built column headers when the language changes
    // (and on the async initial i18n load); rebuild() re-pulls fresh columnDefs.
    merge(
      this.translate.onLangChange,
      this.translate.onDefaultLangChange,
      this.translate.onTranslationChange
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuild());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permissions'] || changes['ownerId']) {
      this.reset();
    }
  }

  /** Discards edits and rebuilds the grid from the current `permissions`/`ownerId` inputs. */
  reset(): void {
    this.selectedPermissionIds = [...(this.permissions ?? [])];
    this.currentOwnerId = this.ownerId;
    this.rebuild();
  }

  /** Currently checked permission ids, read from the live grid (fallback: built row data). */
  getSelectedRoleIds(): string[] {
    if (this.gridApi && !this.gridApi.isDestroyed()) {
      const rows: AccessControlMetadata[] = [];
      this.gridApi.forEachNode((node) => rows.push(node.data));
      return collectSelectedRoleIds(rows);
    }
    return collectSelectedRoleIds(this.tableOptions?.rowData ?? []);
  }

  /**
   * Replaces the current selection (e.g. from an imported metadata file) and
   * rebuilds the grid, keeping the current owner.
   */
  applyPermissions(permissionIds: string[] | null | undefined): void {
    this.selectedPermissionIds = [...(permissionIds ?? [])];
    this.rebuild();
  }

  /**
   * Re-seeds the grid for a new owner unit: its viewer/editor permissions get
   * checked and its row disabled. An empty value clears owner and selection
   * (matches the historical modal behavior of the "keep owner" option).
   */
  applyOwner(orgUnitId: string | null | undefined): void {
    this.currentOwnerId = orgUnitId || null;
    this.selectedPermissionIds = orgUnitId
      ? ownerDefaultPermissionIds(this.accessControlService.accessControl ?? [], orgUnitId)
      : [];
    this.rebuild();
  }

  onActiveRolesOnlyChange(): void {
    this.rebuild();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  private ensureAccessControlLoaded(): void {
    const accessControl = this.accessControlService.accessControl;
    if (accessControl && accessControl.length > 0) {
      this.rebuild();
      return;
    }
    this.metadataBootstrap
      .fetchAccessControlMetadata(this.accessControlService.currentKeycloakLoginRoles)
      .then(() => this.rebuild())
      .catch(() => {
        /* grid stays empty when access control cannot be loaded */
      });
  }

  private rebuild(): void {
    const accessControl = this.accessControlService.accessControl;
    if (!accessControl || accessControl.length === 0) {
      return;
    }

    // Owner flags on a per-grid copy — the grid helper deep-copies the rows
    // anyway, and this keeps concurrent grids from fighting over the shared
    // accessControl array's datasetOwner flags.
    const source = accessControl.map((item: AccessControlMetadata) => ({
      ...item,
      datasetOwner: item.organizationalUnitId === this.currentOwnerId,
    }));

    if (this.showActiveRolesOnlyToggle && this.selectedPermissionIds.length === 0) {
      this.activeRolesOnly.set(false);
    }

    // Always pass null as previous options: the helper then builds fresh
    // rowData/columnDefs and never touches its shared grid API.
    this.tableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      this.gridId,
      null,
      source,
      this.selectedPermissionIds,
      this.reducedColumns
    );
    if (!this.tableOptions) {
      return;
    }

    this.columnDefs.set(this.tableOptions.columnDefs || []);
    let rows = this.tableOptions.rowData || [];
    if (this.showActiveRolesOnlyToggle && this.activeRolesOnly()) {
      rows = rows.filter(
        (row: AccessControlMetadata & { viewer?: boolean; editor?: boolean; creator?: boolean }) =>
          row.viewer || row.editor || row.creator
      );
    }
    this.rowData.set(rows);
  }
}
