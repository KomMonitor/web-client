import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

/**
 * Pure logic shared by the role-management panel components
 * (`<app-role-management-grid>` / `<app-owner-organization-select>`).
 *
 * Extracted from the previously copy-pasted blocks in the spatial-unit and
 * georesource edit-user-roles/add modals (step-3 consolidation, see
 * `documentation/ADMIN_REFACTORING_ANALYSIS.md`).
 */

/**
 * Determines the organizational units the current user holds creator rights
 * for, i.e. the units selectable as (new) dataset owner for non-admins.
 *
 * `unit-resources-creator` grants the unit itself; `client-resources-creator`
 * grants the unit's whole child subtree. The child expansion is cycle-guarded:
 * a unit is never expanded twice, so cyclic organisation hierarchies cannot
 * loop indefinitely (canonical behavior from the spatial-unit modal — the
 * georesource copy lacked the guard).
 */
export function collectCreatorRightOrganizations(
  loginRoleNames: string[],
  accessControl: AccessControlMetadata[]
): AccessControlMetadata[] {
  if (!loginRoleNames?.length || !accessControl?.length) {
    return [];
  }

  const creatorRights: string[] = [];
  const creatorRightsChildren: string[] = [];

  loginRoleNames.forEach((roleName) => {
    const key = roleName.split('.')[0];
    const role = roleName.split('.')[1];

    if (role === 'unit-resources-creator' && !creatorRights.includes(key)) {
      creatorRights.push(key);
    }
    if (role === 'client-resources-creator' && !creatorRightsChildren.includes(key)) {
      creatorRightsChildren.push(key);
    }
  });

  gatherCreatorRightsChildren(accessControl, creatorRights, creatorRightsChildren, new Set());

  return accessControl.filter((elem) => creatorRights.includes(elem.name));
}

function gatherCreatorRightsChildren(
  accessControl: AccessControlMetadata[],
  creatorRights: string[],
  creatorRightsChildren: string[],
  visited: Set<string>
): void {
  const toExpand = creatorRightsChildren.filter((name) => !visited.has(name));
  if (toExpand.length === 0) {
    return;
  }
  toExpand.forEach((name) => visited.add(name));

  accessControl
    .filter((elem) => toExpand.includes(elem.name))
    .flatMap((res) => res.children ?? [])
    .forEach((childId) => {
      accessControl
        .filter((elem) => elem.organizationalUnitId === childId)
        .forEach((childData) => {
          creatorRights.push(childData.name);
          gatherCreatorRightsChildren(accessControl, creatorRights, [childData.name], visited);
        });
    });
}

/**
 * The viewer/editor permission ids of the given organizational unit — the
 * default selection when that unit becomes the owner of a dataset.
 */
export function ownerDefaultPermissionIds(
  accessControl: AccessControlMetadata[],
  orgUnitId: string
): string[] {
  const unit = accessControl?.find((elem) => elem.organizationalUnitId === orgUnitId);
  return (unit?.permissions ?? [])
    .filter(
      (permission) =>
        permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor'
    )
    .map((permission) => permission.permissionId);
}

/**
 * Collects the checked permission ids from role-grid row data
 * (`permissions[].isChecked` as maintained by the checkbox cell renderers).
 */
export function collectSelectedRoleIds(rows: AccessControlMetadata[]): string[] {
  const selectedIds = new Set<string>();
  for (const row of rows ?? []) {
    for (const permission of row?.permissions ?? []) {
      if (permission?.isChecked && permission.permissionId) {
        selectedIds.add(permission.permissionId);
      }
    }
  }
  return Array.from(selectedIds);
}
