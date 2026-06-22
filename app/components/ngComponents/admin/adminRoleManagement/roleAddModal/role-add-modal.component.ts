import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, GridOptions, GridReadyEvent } from "ag-grid-community";
import {
  AccessControlMetadata,
  KommonitorDataExchangeService,
} from "services/adminSpatialUnit/kommonitor-data-exchange.service";
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { AdminRoleManagementService } from "../admin-role-management.service";
import {
  StepperComponent,
  StepperStep,
} from "components/ngComponents/common/stepper/stepper.component";
import { FilterableSelectComponent } from "components/ngComponents/common/filterableSelect/filterable-select.component";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { NotificationService } from "../../../common/notification/notification.service";
import { LoadingOverlayComponent } from "components/ngComponents/common/loading-overlay/loading-overlay.component";

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
  return row.permissions.find(
    (permission) => permission.permissionLevel === permissionLevel,
  );
}

function setPermissionChecked(
  row: AdvancedAccessControlRow,
  permissionLevel: string,
  checked: boolean,
): void {
  const permission = getPermission(row, permissionLevel);
  if (permission) {
    permission.isChecked = checked;
  }
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
    private boundCheckedHandler: ((event: Event) => void) | null = null;

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

      this.boundCheckedHandler = this.checkedHandler.bind(this);
      input.addEventListener("click", this.boundCheckedHandler);
      this.eGui = input;
    }

    checkedHandler(event: Event): void {
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
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener("click", this.boundCheckedHandler);
      }
    }
  };
}

@Component({
  selector: "app-role-add-modal",
  templateUrl: "./role-add-modal.component.html",
  styleUrls: ["./role-add-modal.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    StepperComponent,
    AgGridAngular,
    FilterableSelectComponent,
    ExpandableBoxComponent,
    LoadingOverlayComponent,
  ],
  standalone: true,
})
export class RoleAddModalComponent implements OnInit {
  processCreation: boolean = false;
  nameInvalid: boolean = false;
  delegatedRoleIds: string[] = [];

  roleDelegatesColumnDefs: ColDef[] = [];
  roleDelegatesRowData: AdvancedAccessControlRow[] = [];
  roleDelegatesDefaultColDef: ColDef = {};
  roleDelegatesGridOptions: GridOptions = {};
  roleDelegatesTableOptions: {
    components?: Record<string, unknown>;
    rowData?: AdvancedAccessControlRow[];
    columnDefs?: ColDef[];
  } = {};
  private roleDelegatesGridApi: any = null;

  errorMessagePart: string | undefined;
  keycloakErrorMessagePart: string | undefined;
  showErrorAlert: boolean = false;
  showKeycloakErrorAlert: boolean = false;

  newOrganizationalUnit: {
    name?: string;
    description?: string;
    contact?: string;
    mandant?: boolean;
    parentId?: string;
    organizationalUnitId?: string;
  } = {};

  protected steps: StepperStep[] = [
    { label: "Basisinformationen" },
    { label: "Rechte anderer Gruppen an neuer Gruppe" },
  ];
  protected currentStep: number = 1;
  protected accessControlOptions =
    this.kommonitorDataExchangeService.accessControl.sort((left, right) =>
      left.name.localeCompare(right.name, "de"),
    );

  constructor(
    protected activeModal: NgbActiveModal,
    protected kommonitorDataExchangeService: KommonitorDataExchangeService,
    private roleManagementHelper: RoleManagementDataGridHelperService,
    private adminRoleManagementService: AdminRoleManagementService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.reset();

    if (this.kommonitorDataExchangeService.accessControl.length > 0) {
      this.buildRoleDelegatesTable();
      return;
    }

    this.kommonitorDataExchangeService
      .fetchAccessControlMetadata(true)
      .subscribe({
        next: () => this.buildRoleDelegatesTable(),
      });
  }

  get isRealmAdmin(): boolean {
    return this.kommonitorDataExchangeService.checkAdminPermission();
  }

  get parentSelected(): boolean {
    return !!this.newOrganizationalUnit.parentId;
  }

  get canSubmit(): boolean {
    if (
      this.processCreation ||
      this.nameInvalid ||
      !this.isRealmAdmin ||
      !this.newOrganizationalUnit.name ||
      !this.newOrganizationalUnit.description ||
      !this.newOrganizationalUnit.contact
    ) {
      return false;
    }

    if (
      this.newOrganizationalUnit.mandant === true ||
      this.newOrganizationalUnit.parentId !== undefined
    ) {
      return true;
    }
    return false;
  }

  reset(): void {
    this.newOrganizationalUnit = { mandant: false, parentId: undefined };
    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;
    this.showErrorAlert = false;
    this.showKeycloakErrorAlert = false;
    this.nameInvalid = false;
    this.currentStep = 1;

    if (this.kommonitorDataExchangeService.accessControl.length > 0) {
      this.buildRoleDelegatesTable();
    }
  }

  checkName(): void {
    this.nameInvalid = this.kommonitorDataExchangeService.accessControl.some(
      (ou) => ou.name === this.newOrganizationalUnit.name,
    );
  }

  close(): void {
    this.activeModal.dismiss("closed");
  }

  onMandantChange(): void {
    if (this.newOrganizationalUnit.mandant) {
      this.newOrganizationalUnit.parentId = undefined;
    }
  }

  onParentOrganizationalUnitChange(parent: AccessControlMetadata): void {
    this.newOrganizationalUnit.parentId =
      parent.organizationalUnitId || undefined;

    if (this.newOrganizationalUnit.parentId) {
      this.newOrganizationalUnit.mandant = false;
    }
  }

  getParentOrganizationalUnit(): AccessControlMetadata | null {
    if (!this.newOrganizationalUnit.parentId) {
      return null;
    }

    return (
      this.kommonitorDataExchangeService.getAccessControlById(
        this.newOrganizationalUnit.parentId,
      ) || null
    );
  }

  onRoleDelegatesGridReady(params: GridReadyEvent): void {
    this.roleDelegatesGridApi = params.api;
  }

  private buildRoleDelegatesTable(): void {
    const rowData = this.buildAdvancedRoleManagementGridRowData(
      this.kommonitorDataExchangeService.accessControl,
      [],
    );
    const components = this.getAdvancedRoleManagementComponents();

    this.roleDelegatesColumnDefs =
      this.buildAdvancedRoleManagementColumnConfig();
    this.roleDelegatesRowData = rowData;
    this.roleDelegatesDefaultColDef = {
      ...this.roleManagementHelper.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
    };
    this.roleDelegatesTableOptions = {
      components,
      rowData,
      columnDefs: this.roleDelegatesColumnDefs,
    };

    const baseGridOptions =
      this.roleManagementHelper.buildRoleManagementGridOptionsPublic(
        components,
      );

    this.roleDelegatesGridOptions = {
      ...baseGridOptions,
      paginationPageSize: 5,
      headerHeight: 52,
      rowHeight: 42,
      onGridReady: (params) => this.onRoleDelegatesGridReady(params),
    };
  }

  private buildAdvancedRoleManagementGridRowData(
    accessControlMetadata: AccessControlMetadata[],
    permissionIds: string[],
  ): AdvancedAccessControlRow[] {
    return accessControlMetadata
      .map((organizationalUnit) => {
        const row: AdvancedAccessControlRow = JSON.parse(
          JSON.stringify(organizationalUnit),
        );
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

        row.disabled = false;
        return row;
      })
      .sort((left, right) => left.name.localeCompare(right.name, "de"));
  }

  private buildAdvancedRoleManagementColumnConfig(): ColDef[] {
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

  private getAdvancedRoleManagementComponents(): Record<string, unknown> {
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

  private getSelectedDelegatedPermissionIds(): string[] {
    const selectedPermissionIds = new Set<string>();

    const collectPermissions = (row: AdvancedAccessControlRow): void => {
      row.permissions.forEach((permission) => {
        if (
          ADVANCED_PERMISSION_GROUPS.some(
            ({ groupLevel, subGroupLevel }) =>
              permission.permissionLevel === groupLevel ||
              permission.permissionLevel === subGroupLevel,
          ) &&
          permission.isChecked
        ) {
          selectedPermissionIds.add(permission.permissionId);
        }
      });
    };

    if (
      this.roleDelegatesGridApi &&
      !this.roleDelegatesGridApi.isDestroyed?.()
    ) {
      this.roleDelegatesGridApi.forEachNode((node: any) =>
        collectPermissions(node.data),
      );
    } else {
      this.roleDelegatesRowData.forEach((row) => collectPermissions(row));
    }

    return Array.from(selectedPermissionIds);
  }

  private buildRoleDelegatesPutBody(): Array<{
    organizationalUnitId: string;
    organizationalUnitName: string;
    keycloakId?: string;
    adminRoles: string[];
  }> {
    const rolesByOrganizationalUnit = new Map<string, string[]>();

    this.delegatedRoleIds = [];

    this.getSelectedDelegatedPermissionIds().forEach((permissionId) => {
      const matchingLevel = ADVANCED_PERMISSION_GROUPS.flatMap((group) => [
        group.groupLevel,
        group.subGroupLevel,
      ]).find((permissionLevel) =>
        permissionId.endsWith(`-${permissionLevel}`),
      );

      if (!matchingLevel) {
        return;
      }

      const organizationalUnitId = permissionId.slice(
        0,
        -(matchingLevel.length + 1),
      );

      const currentRoles =
        rolesByOrganizationalUnit.get(organizationalUnitId) || [];
      if (!currentRoles.includes(matchingLevel)) {
        currentRoles.push(matchingLevel);
      }
      rolesByOrganizationalUnit.set(organizationalUnitId, currentRoles);

      if (!this.delegatedRoleIds.includes(organizationalUnitId)) {
        this.delegatedRoleIds.push(organizationalUnitId);
      }
    });

    return Array.from(rolesByOrganizationalUnit.entries()).map(
      ([organizationalUnitId, adminRoles]) => {
        const organizationalUnit =
          this.kommonitorDataExchangeService.getAccessControlById(
            organizationalUnitId,
          );

        return {
          organizationalUnitId,
          organizationalUnitName:
            organizationalUnit?.name || organizationalUnitId,
          keycloakId: organizationalUnit?.keycloakId,
          adminRoles,
        };
      },
    );
  }

  addOrganizationalUnit(): void {
    if (!this.canSubmit) return;

    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;
    this.processCreation = true;

    const postBody = {
      name: this.newOrganizationalUnit.name,
      description: this.newOrganizationalUnit.description,
      contact: this.newOrganizationalUnit.contact,
      mandant: !!this.newOrganizationalUnit.mandant,
      parentId: this.newOrganizationalUnit.parentId,
    };

    const parentOrganizationalUnit = this.getParentOrganizationalUnit();

    const roleDelegatesPutBody = this.buildRoleDelegatesPutBody();

    this.adminRoleManagementService
      .addOrganizationalUnit(
        postBody,
        parentOrganizationalUnit,
        roleDelegatesPutBody,
      )
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(
            `Die neue Organisationseinheit '${this.newOrganizationalUnit.name}' wurde erfolgreich erstellt..`,
          );
          this.notificationService.showSuccess(
            "Keycloak-Rollen erfolgreich angelegt.",
          );
          this.processCreation = false;
          this.activeModal.close(true);
        },
        error: (error: any) => {
          const payload = error?.error || error;

          // Distinguish HTTP/backend errors from Keycloak/service errors by status presence
          if (error && error.status !== undefined) {
            this.errorMessagePart =
              this.kommonitorDataExchangeService.syntaxHighlightJSON(payload);
            this.showErrorAlert = true;
          } else {
            this.keycloakErrorMessagePart =
              this.kommonitorDataExchangeService.syntaxHighlightJSON(payload);
            if (!this.showErrorAlert) {
              this.showKeycloakErrorAlert = true;
            }
          }

          this.processCreation = false;
        },
      });
  }
}
