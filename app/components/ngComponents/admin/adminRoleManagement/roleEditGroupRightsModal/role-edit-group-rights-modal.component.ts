import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, GridOptions, GridReadyEvent } from "ag-grid-community";
import {
  AccessControlMetadata,
  KommonitorDataExchangeService,
} from "services/adminSpatialUnit/kommonitor-data-exchange.service";
import { KommonitorDataGridHelperService } from "services/adminSpatialUnit/kommonitor-data-grid-helper.service";
import {
  AdminRoleManagementService,
  RoleDelegatePutEntry,
} from "../admin-role-management.service";
import {
  StepperComponent,
  StepperStep,
} from "components/ngComponents/common/stepper/stepper.component";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { LoadingOverlayComponent } from "components/ngComponents/common/loading-overlay/loading-overlay.component";
import { NotificationService } from "../../../common/notification/notification.service";
import { forkJoin } from "rxjs";

type AdvancedPermissionLevel =
  | "unit-users-creator"
  | "client-users-creator"
  | "unit-resources-creator"
  | "client-resources-creator"
  | "unit-themes-creator"
  | "client-themes-creator";

type PermissionWithSelection = {
  permissionId: string;
  permissionLevel: string;
  isChecked?: boolean;
};

type AdvancedAccessControlRow = AccessControlMetadata & {
  permissions: PermissionWithSelection[];
  disabled?: boolean;
  _disable_unit_users_creator?: boolean;
  _disable_unit_resources_creator?: boolean;
  _disable_unit_themes_creator?: boolean;
};

const ADVANCED_PERMISSION_GROUPS: Array<{
  headerName: string;
  groupLevel: AdvancedPermissionLevel;
  subGroupLevel: AdvancedPermissionLevel;
  groupRenderer: string;
  subGroupRenderer: string;
}> = [
  {
    headerName: "Verwalten von Nutzern",
    groupLevel: "unit-users-creator",
    subGroupLevel: "client-users-creator",
    groupRenderer: "checkboxRenderer_UM_group",
    subGroupRenderer: "checkboxRenderer_UM_subGroup",
  },
  {
    headerName: "Verwalten von Ressourcen",
    groupLevel: "unit-resources-creator",
    subGroupLevel: "client-resources-creator",
    groupRenderer: "checkboxRenderer_RM_group",
    subGroupRenderer: "checkboxRenderer_RM_subGroup",
  },
  {
    headerName: "Verwalten von Themen",
    groupLevel: "unit-themes-creator",
    subGroupLevel: "client-themes-creator",
    groupRenderer: "checkboxRenderer_TM_group",
    subGroupRenderer: "checkboxRenderer_TM_subGroup",
  },
];

function getDisableKey(
  permissionLevel: string,
):
  | "_disable_unit_users_creator"
  | "_disable_unit_resources_creator"
  | "_disable_unit_themes_creator" {
  return `_disable_${permissionLevel.replace(/-/g, "_")}` as
    | "_disable_unit_users_creator"
    | "_disable_unit_resources_creator"
    | "_disable_unit_themes_creator";
}

function getPermission(
  row: AdvancedAccessControlRow,
  permissionLevel: string,
): PermissionWithSelection | undefined {
  return row.permissions.find((p) => p.permissionLevel === permissionLevel);
}

function setPermissionChecked(
  row: AdvancedAccessControlRow,
  permissionLevel: string,
  checked: boolean,
): void {
  const perm = getPermission(row, permissionLevel);
  if (perm) perm.isChecked = checked;
}

function isPermissionChecked(
  row: AdvancedAccessControlRow,
  permissionLevel: string,
): boolean {
  return !!getPermission(row, permissionLevel)?.isChecked;
}

function createAdvancedCheckboxRenderer(
  currentLevel: AdvancedPermissionLevel,
  impliedGroupLevel?: AdvancedPermissionLevel,
) {
  return class {
    private params: any;
    private eGui: HTMLInputElement | HTMLSpanElement | null = null;
    private boundClickHandler: ((event: Event) => void) | null = null;

    init(params: any): void {
      this.params = params;
      const permission = getPermission(params.data, currentLevel);

      if (!permission) {
        this.eGui = document.createElement("span");
        return;
      }

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!permission.isChecked;

      const disableKey = impliedGroupLevel
        ? undefined
        : getDisableKey(currentLevel);
      input.disabled =
        !!params.data.disabled || !!(disableKey && params.data[disableKey]);

      this.boundClickHandler = this.clickHandler.bind(this);
      input.addEventListener("click", this.boundClickHandler);
      this.eGui = input;
    }

    clickHandler(event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
      const row = this.params.data as AdvancedAccessControlRow;

      setPermissionChecked(row, currentLevel, checked);

      if (impliedGroupLevel) {
        const disableKey = getDisableKey(impliedGroupLevel);
        row[disableKey] = checked;
        if (checked) {
          setPermissionChecked(row, impliedGroupLevel, true);
        }
      }

      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({
          force: true,
          rowNodes: [this.params.node],
        });
      }
    }

    getGui(): HTMLElement {
      return this.eGui as HTMLElement;
    }

    destroy(): void {
      if (this.eGui && this.boundClickHandler) {
        this.eGui.removeEventListener("click", this.boundClickHandler);
      }
    }
  };
}

@Component({
  selector: "role-edit-group-rights-modal",
  templateUrl: "./role-edit-group-rights-modal.component.html",
  styleUrls: ["./role-edit-group-rights-modal.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    StepperComponent,
    ExpandableBoxComponent,
    LoadingOverlayComponent,
  ],
  standalone: true,
})
export class RoleEditGroupRightsModalComponent implements OnInit {
  @Input() currentDataset!: AccessControlMetadata;

  loadingData: boolean = false;
  showErrorAlert: boolean = false;
  errorMessagePart: string | undefined;
  activeDelegatedRolesOnly: boolean = true;

  protected steps: StepperStep[] = [
    { label: "Eigene Rechte an anderen Gruppen" },
    { label: "Rechte anderer Gruppen an gewählter Gruppe" },
  ];
  protected currentStep: number = 1;

  // Authority table (step 1, read-only)
  authorityColumnDefs: ColDef[] = [];
  authorityRowData: AdvancedAccessControlRow[] = [];
  authorityDefaultColDef: ColDef = {};
  authorityGridOptions: GridOptions = {};

  // Delegated table (step 2, editable)
  delegatedColumnDefs: ColDef[] = [];
  delegatedRowData: AdvancedAccessControlRow[] = [];
  delegatedDefaultColDef: ColDef = {};
  delegatedGridOptions: GridOptions = {};
  private delegatedGridApi: any = null;

  private allDelegatedRowData: AdvancedAccessControlRow[] = [];
  private delegatedRoleIds: string[] = [];

  constructor(
    protected activeModal: NgbActiveModal,
    protected kommonitorDataExchangeService: KommonitorDataExchangeService,
    private kommonitorDataGridHelperService: KommonitorDataGridHelperService,
    private adminRoleManagementService: AdminRoleManagementService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadingData = true;

    forkJoin({
      authorities: this.adminRoleManagementService.getAuthorityRoles(
        this.currentDataset.organizationalUnitId,
      ),
      delegates: this.adminRoleManagementService.getDelegatedRoles(
        this.currentDataset.organizationalUnitId,
      ),
    }).subscribe({
      next: ({ authorities, delegates }) => {
        this.buildAuthorityTable(authorities.authorityRoles);
        this.buildDelegatedTable(delegates.roleDelegates);
        this.loadingData = false;
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError(
          "Die Rollendaten konnten nicht geladen werden.",
        );
        this.loadingData = false;
      },
    });
  }

  private buildAuthorityTable(
    authorityRoles: Array<{
      organizationalUnitId: string;
      adminRoles: string[];
    }>,
  ): void {
    const authorityRoleIds = authorityRoles.map((r) => r.organizationalUnitId);
    const authorityPermissionIds = authorityRoles.flatMap((r) =>
      r.adminRoles.map((role) => `${r.organizationalUnitId}-${role}`),
    );

    const access = this.kommonitorDataExchangeService.accessControl.filter(
      (item) => authorityRoleIds.includes(item.organizationalUnitId),
    );

    const rowData = this.buildRowData(access, authorityPermissionIds, true);
    const components = this.getComponents();

    this.authorityColumnDefs = this.buildColumnDefs();
    this.authorityRowData = rowData;
    this.authorityDefaultColDef = {
      ...this.kommonitorDataGridHelperService.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
    };
    const baseOptions =
      this.kommonitorDataGridHelperService.buildRoleManagementGridOptionsPublic(
        components,
      );
    this.authorityGridOptions = {
      ...baseOptions,
      paginationPageSize: 5,
      headerHeight: 52,
      rowHeight: 42,
    };
  }

  private buildDelegatedTable(
    roleDelegates: Array<{
      organizationalUnitId: string;
      adminRoles: string[];
    }>,
  ): void {
    this.delegatedRoleIds = roleDelegates.map((r) => r.organizationalUnitId);
    const delegatedPermissionIds = roleDelegates.flatMap((r) =>
      r.adminRoles.map((role) => `${r.organizationalUnitId}-${role}`),
    );

    if (this.delegatedRoleIds.length === 0) {
      this.activeDelegatedRolesOnly = false;
    }

    const allAccess = this.kommonitorDataExchangeService.accessControl;
    this.allDelegatedRowData = this.buildRowData(
      allAccess,
      delegatedPermissionIds,
      false,
    );

    const components = this.getComponents();
    this.delegatedColumnDefs = this.buildColumnDefs();
    this.delegatedDefaultColDef = {
      ...this.kommonitorDataGridHelperService.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
    };
    const baseOptions =
      this.kommonitorDataGridHelperService.buildRoleManagementGridOptionsPublic(
        components,
      );
    this.delegatedGridOptions = {
      ...baseOptions,
      paginationPageSize: 5,
      headerHeight: 52,
      rowHeight: 42,
      onGridReady: (params: GridReadyEvent) => {
        this.delegatedGridApi = params.api;
      },
    };

    this.applyDelegatedFilter();
  }

  onActiveDelegatedRolesOnlyChange(): void {
    this.applyDelegatedFilter();
  }

  private applyDelegatedFilter(): void {
    if (this.delegatedRoleIds.length > 0 && this.activeDelegatedRolesOnly) {
      this.delegatedRowData = this.allDelegatedRowData.filter((row) =>
        this.delegatedRoleIds.includes(row.organizationalUnitId),
      );
    } else {
      this.delegatedRowData = [...this.allDelegatedRowData];
    }
  }

  private buildRowData(
    access: AccessControlMetadata[],
    permissionIds: string[],
    disabled: boolean,
  ): AdvancedAccessControlRow[] {
    return access
      .map((item) => {
        const row: AdvancedAccessControlRow = JSON.parse(JSON.stringify(item));
        row.permissions = row.permissions || [];

        ADVANCED_PERMISSION_GROUPS.forEach(({ groupLevel, subGroupLevel }) => {
          if (!getPermission(row, groupLevel)) {
            row.permissions.push({
              permissionLevel: groupLevel,
              permissionId: `${row.organizationalUnitId}-${groupLevel}`,
              isChecked: false,
            });
          }
          if (!getPermission(row, subGroupLevel)) {
            row.permissions.push({
              permissionLevel: subGroupLevel,
              permissionId: `${row.organizationalUnitId}-${subGroupLevel}`,
              isChecked: false,
            });
          }

          setPermissionChecked(
            row,
            groupLevel,
            permissionIds.includes(`${row.organizationalUnitId}-${groupLevel}`),
          );
          setPermissionChecked(
            row,
            subGroupLevel,
            permissionIds.includes(
              `${row.organizationalUnitId}-${subGroupLevel}`,
            ),
          );

          if (isPermissionChecked(row, subGroupLevel)) {
            setPermissionChecked(row, groupLevel, true);
            row[getDisableKey(groupLevel)] = true;
          } else {
            row[getDisableKey(groupLevel)] = false;
          }
        });

        row.disabled = disabled;
        return row;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  private buildColumnDefs(): ColDef[] {
    return [
      {
        headerName: "Organisationseinheit",
        field: "name",
        minWidth: 220,
        pinned: "left",
      },
      ...ADVANCED_PERMISSION_GROUPS.map(
        ({ headerName, groupRenderer, subGroupRenderer }) => ({
          headerName,
          children: [
            {
              headerName: "Diese Gruppe",
              field: groupRenderer,
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: groupRenderer,
            },
            {
              headerName: "Untergruppen",
              field: subGroupRenderer,
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: subGroupRenderer,
            },
          ],
        }),
      ),
    ];
  }

  private getComponents(): Record<string, unknown> {
    return {
      checkboxRenderer_UM_group:
        createAdvancedCheckboxRenderer("unit-users-creator"),
      checkboxRenderer_UM_subGroup: createAdvancedCheckboxRenderer(
        "client-users-creator",
        "unit-users-creator",
      ),
      checkboxRenderer_RM_group: createAdvancedCheckboxRenderer(
        "unit-resources-creator",
      ),
      checkboxRenderer_RM_subGroup: createAdvancedCheckboxRenderer(
        "client-resources-creator",
        "unit-resources-creator",
      ),
      checkboxRenderer_TM_group: createAdvancedCheckboxRenderer(
        "unit-themes-creator",
      ),
      checkboxRenderer_TM_subGroup: createAdvancedCheckboxRenderer(
        "client-themes-creator",
        "unit-themes-creator",
      ),
    };
  }

  private getSelectedPermissionIds(): string[] {
    const result = new Set<string>();

    const collect = (row: AdvancedAccessControlRow): void => {
      row.permissions.forEach((perm) => {
        if (
          ADVANCED_PERMISSION_GROUPS.some(
            ({ groupLevel, subGroupLevel }) =>
              perm.permissionLevel === groupLevel ||
              perm.permissionLevel === subGroupLevel,
          ) &&
          perm.isChecked
        ) {
          result.add(perm.permissionId);
        }
      });
    };

    if (this.delegatedGridApi && !this.delegatedGridApi.isDestroyed?.()) {
      this.delegatedGridApi.forEachNode((node: any) => collect(node.data));
    } else {
      this.delegatedRowData.forEach((row) => collect(row));
    }

    return Array.from(result);
  }

  private buildPutBody(): RoleDelegatePutEntry[] {
    const rolesByUnit = new Map<string, string[]>();

    this.getSelectedPermissionIds().forEach((permissionId) => {
      const matchingLevel = ADVANCED_PERMISSION_GROUPS.flatMap((g) => [
        g.groupLevel,
        g.subGroupLevel,
      ]).find((level) => permissionId.endsWith(`-${level}`));

      if (!matchingLevel) return;

      const unitId = permissionId.slice(0, -(matchingLevel.length + 1));
      const roles = rolesByUnit.get(unitId) || [];
      if (!roles.includes(matchingLevel)) roles.push(matchingLevel);
      rolesByUnit.set(unitId, roles);
    });

    return Array.from(rolesByUnit.entries()).map(([unitId, adminRoles]) => {
      const unit =
        this.kommonitorDataExchangeService.getAccessControlById(unitId);
      return {
        organizationalUnitId: unitId,
        organizationalUnitName: unit?.name || unitId,
        keycloakId: unit?.keycloakId,
        adminRoles,
      };
    });
  }

  updateDelegatedRoles(): void {
    this.loadingData = true;
    this.showErrorAlert = false;

    const putBody = this.buildPutBody();

    this.adminRoleManagementService
      .updateDelegatedRoles(this.currentDataset.organizationalUnitId, putBody)
      .subscribe((result) => {
        if (result.success) {
          this.notificationService.showSuccess(
            `Gruppenrechte für '${this.currentDataset.name}' erfolgreich aktualisiert.`,
          );
          this.activeModal.close(true);
        } else {
          this.errorMessagePart = result.errorMessagePart;
          this.showErrorAlert = true;
          this.loadingData = false;
        }
      });
  }

  reset(): void {
    this.showErrorAlert = false;
    this.errorMessagePart = undefined;
    this.ngOnInit();
  }

  close(): void {
    this.activeModal.dismiss("closed");
  }
}
