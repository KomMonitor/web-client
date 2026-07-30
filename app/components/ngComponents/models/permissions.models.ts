import { OrganizationalUnitOverviewType, PermissionOverviewType } from 'models/data-management-api';

/**
 * Permission entry of an organizational unit as delivered by the Data
 * Management API (PermissionOverviewType), plus the client-side selection flag
 * used by the role-assignment grids.
 */
export interface AccessControlPermission extends Omit<PermissionOverviewType, 'permissionLevel'> {
  /**
   * Loosened vs. the API enum ('creator' | 'editor' | 'viewer'): the role
   * grids also store advanced delegate levels here (e.g. 'unit-users-creator',
   * see adminRoleManagement/advanced-role-permissions.ts).
   */
  permissionLevel: string;
  isChecked?: boolean;
}

/**
 * Organizational unit (group) as delivered by the Data Management API
 * (OrganizationalUnitOverviewType). All fields except the identifying ones are
 * loosened to optional because client code (e.g. role add forms) builds partial
 * objects before they are persisted.
 */
export interface AccessControlMetadata extends Partial<
  Omit<OrganizationalUnitOverviewType, 'organizationalUnitId' | 'name' | 'permissions'>
> {
  organizationalUnitId: string;
  name: string;
  permissions: AccessControlPermission[];
  /** client-side flag: marks the unit owning the dataset currently being edited */
  datasetOwner?: boolean;
}

/**
 * Entry of AccessControlService.availableRoles: a permission enriched with its
 * organizational unit and the composite role name used across the role grids.
 */
export interface AvailableRole extends AccessControlPermission {
  organizationalUnit: AccessControlMetadata;
  roleName: string;
}
