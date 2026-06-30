import { ColDef, GridApi } from 'ag-grid-community';
import { AccessControlMetadata } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { RoleDelegatePutEntry } from './admin-role-management.service';

/**
 * Shared building blocks for the "advanced" role-delegation grid used by both
 * the role-add modal (rights other groups get on the new group) and the
 * role-edit-group-rights modal (rights other groups have on the selected
 * group). Both grids are structurally identical — three permission groups,
 * each with a "this group" / "subgroups" checkbox column whose selection in the
 * subgroup implies the group level. This module is the single source of truth
 * for that logic so the two modals cannot drift apart.
 */

export type AdvancedPermissionLevel =
  | 'unit-users-creator'
  | 'client-users-creator'
  | 'unit-resources-creator'
  | 'client-resources-creator'
  | 'unit-themes-creator'
  | 'client-themes-creator';

export type PermissionWithSelection = {
  permissionId: string;
  permissionLevel: string;
  isChecked?: boolean;
};

export type AdvancedAccessControlRow = AccessControlMetadata & {
  permissions: PermissionWithSelection[];
  disabled?: boolean;
  _disable_unit_users_creator?: boolean;
  _disable_unit_resources_creator?: boolean;
  _disable_unit_themes_creator?: boolean;
};

type AdvancedDisableKey =
  | '_disable_unit_users_creator'
  | '_disable_unit_resources_creator'
  | '_disable_unit_themes_creator';

export const ADVANCED_PERMISSION_GROUPS: Array<{
  headerName: string;
  groupLevel: AdvancedPermissionLevel;
  subGroupLevel: AdvancedPermissionLevel;
  groupRenderer: string;
  subGroupRenderer: string;
}> = [
  {
    headerName: 'Verwalten von Nutzern',
    groupLevel: 'unit-users-creator',
    subGroupLevel: 'client-users-creator',
    groupRenderer: 'checkboxRenderer_UM_group',
    subGroupRenderer: 'checkboxRenderer_UM_subGroup',
  },
  {
    headerName: 'Verwalten von Ressourcen',
    groupLevel: 'unit-resources-creator',
    subGroupLevel: 'client-resources-creator',
    groupRenderer: 'checkboxRenderer_RM_group',
    subGroupRenderer: 'checkboxRenderer_RM_subGroup',
  },
  {
    headerName: 'Verwalten von Themen',
    groupLevel: 'unit-themes-creator',
    subGroupLevel: 'client-themes-creator',
    groupRenderer: 'checkboxRenderer_TM_group',
    subGroupRenderer: 'checkboxRenderer_TM_subGroup',
  },
];

export function getDisableKey(permissionLevel: string): AdvancedDisableKey {
  return `_disable_${permissionLevel.replace(/-/g, '_')}` as AdvancedDisableKey;
}

export function getPermission(
  row: AdvancedAccessControlRow,
  permissionLevel: string
): PermissionWithSelection | undefined {
  return row.permissions.find((permission) => permission.permissionLevel === permissionLevel);
}

export function setPermissionChecked(
  row: AdvancedAccessControlRow,
  permissionLevel: string,
  checked: boolean
): void {
  const permission = getPermission(row, permissionLevel);
  if (permission) {
    permission.isChecked = checked;
  }
}

export function isPermissionChecked(
  row: AdvancedAccessControlRow,
  permissionLevel: string
): boolean {
  return !!getPermission(row, permissionLevel)?.isChecked;
}

/**
 * Factory for an ag-Grid checkbox cell renderer bound to a single permission
 * level. When `impliedGroupLevel` is given (the subgroup column), checking it
 * also checks and disables the corresponding group-level checkbox.
 */
export function createAdvancedCheckboxRenderer(
  currentLevel: AdvancedPermissionLevel,
  impliedGroupLevel?: AdvancedPermissionLevel
) {
  return class {
    private params: any;
    private eGui: HTMLInputElement | HTMLSpanElement | null = null;
    private boundClickHandler: ((event: Event) => void) | null = null;

    init(params: any): void {
      this.params = params;
      const permission = getPermission(params.data, currentLevel);

      if (!permission) {
        this.eGui = document.createElement('span');
        return;
      }

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!permission.isChecked;

      const disableKey = impliedGroupLevel ? undefined : getDisableKey(currentLevel);
      input.disabled = !!params.data.disabled || !!(disableKey && params.data[disableKey]);

      this.boundClickHandler = this.clickHandler.bind(this);
      input.addEventListener('click', this.boundClickHandler);
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
        this.eGui.removeEventListener('click', this.boundClickHandler);
      }
    }
  };
}

/**
 * Clone the access-control metadata into editable grid rows, seeding every
 * advanced permission level and pre-selecting the ones contained in
 * `permissionIds`. A selected subgroup level implies (and locks) its group
 * level. `disabled` makes the whole row read-only (used for the authority
 * table).
 */
export function buildAdvancedRoleRowData(
  access: AccessControlMetadata[],
  permissionIds: string[],
  disabled: boolean = false
): AdvancedAccessControlRow[] {
  return access
    .map((organizationalUnit) => {
      const row: AdvancedAccessControlRow = JSON.parse(JSON.stringify(organizationalUnit));
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
          permissionIds.includes(`${row.organizationalUnitId}-${groupLevel}`)
        );
        setPermissionChecked(
          row,
          subGroupLevel,
          permissionIds.includes(`${row.organizationalUnitId}-${subGroupLevel}`)
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
    .sort((left, right) => left.name.localeCompare(right.name, 'de'));
}

export function buildAdvancedColumnDefs(): ColDef[] {
  return [
    {
      headerName: 'Organisationseinheit',
      field: 'name',
      minWidth: 220,
      pinned: 'left',
    },
    ...ADVANCED_PERMISSION_GROUPS.map(({ headerName, groupRenderer, subGroupRenderer }) => ({
      headerName,
      children: [
        {
          headerName: 'Diese Gruppe',
          field: groupRenderer,
          filter: false,
          sortable: false,
          width: 120,
          cellRenderer: groupRenderer,
        },
        {
          headerName: 'Untergruppen',
          field: subGroupRenderer,
          filter: false,
          sortable: false,
          width: 120,
          cellRenderer: subGroupRenderer,
        },
      ],
    })),
  ];
}

export function createAdvancedRoleComponents(): Record<string, unknown> {
  return {
    checkboxRenderer_UM_group: createAdvancedCheckboxRenderer('unit-users-creator'),
    checkboxRenderer_UM_subGroup: createAdvancedCheckboxRenderer(
      'client-users-creator',
      'unit-users-creator'
    ),
    checkboxRenderer_RM_group: createAdvancedCheckboxRenderer('unit-resources-creator'),
    checkboxRenderer_RM_subGroup: createAdvancedCheckboxRenderer(
      'client-resources-creator',
      'unit-resources-creator'
    ),
    checkboxRenderer_TM_group: createAdvancedCheckboxRenderer('unit-themes-creator'),
    checkboxRenderer_TM_subGroup: createAdvancedCheckboxRenderer(
      'client-themes-creator',
      'unit-themes-creator'
    ),
  };
}

/**
 * Collect the checked advanced-permission IDs, preferring live grid state and
 * falling back to the row data when the grid API is gone.
 */
export function collectSelectedPermissionIds(
  gridApi: GridApi | null,
  fallbackRowData: AdvancedAccessControlRow[]
): string[] {
  const result = new Set<string>();

  const collect = (row: AdvancedAccessControlRow): void => {
    row.permissions.forEach((permission) => {
      if (
        ADVANCED_PERMISSION_GROUPS.some(
          ({ groupLevel, subGroupLevel }) =>
            permission.permissionLevel === groupLevel ||
            permission.permissionLevel === subGroupLevel
        ) &&
        permission.isChecked
      ) {
        result.add(permission.permissionId);
      }
    });
  };

  if (gridApi && !(gridApi as any).isDestroyed?.()) {
    gridApi.forEachNode((node: any) => collect(node.data));
  } else {
    fallbackRowData.forEach((row) => collect(row));
  }

  return Array.from(result);
}

/**
 * Turn the flat list of selected permission IDs (`<unitId>-<level>`) into the
 * grouped PUT body the role-delegates endpoint expects, resolving display names
 * and keycloak IDs via `getUnitById`.
 */
export function buildRoleDelegatesPutBody(
  selectedPermissionIds: string[],
  getUnitById: (id: string) => AccessControlMetadata | undefined
): RoleDelegatePutEntry[] {
  const rolesByUnit = new Map<string, string[]>();

  selectedPermissionIds.forEach((permissionId) => {
    const matchingLevel = ADVANCED_PERMISSION_GROUPS.flatMap((group) => [
      group.groupLevel,
      group.subGroupLevel,
    ]).find((level) => permissionId.endsWith(`-${level}`));

    if (!matchingLevel) {
      return;
    }

    const unitId = permissionId.slice(0, -(matchingLevel.length + 1));
    const roles = rolesByUnit.get(unitId) || [];
    if (!roles.includes(matchingLevel)) {
      roles.push(matchingLevel);
    }
    rolesByUnit.set(unitId, roles);
  });

  return Array.from(rolesByUnit.entries()).map(([unitId, adminRoles]) => {
    const unit = getUnitById(unitId);
    return {
      organizationalUnitId: unitId,
      organizationalUnitName: unit?.name || unitId,
      keycloakId: unit?.keycloakId,
      adminRoles,
    };
  });
}
