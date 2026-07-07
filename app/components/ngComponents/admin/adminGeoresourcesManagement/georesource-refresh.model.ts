/**
 * Payload a georesource modal emits to ask the management component to refresh
 * its overview table after a CRUD change.
 *
 * This replaces the former `RefreshGeoresourceOverviewTable` broadcast for the
 * admin-managed modals: that was a plain modal -> parent notification routed
 * needlessly through the global event bus, even though the management component
 * opens every one of these modals itself and can subscribe to a direct
 * `@Output()` instead (same pattern as adminSpatialUnitsManagement).
 */
export interface GeoresourceRefreshRequest {
  crudType: 'add' | 'edit' | 'delete';
  // Optional to mirror the former broadcast payload: on 'add' the id is derived
  // from the importer response and may be undefined, in which case the
  // management component falls back to a full metadata refetch.
  targetGeoresourceId?: string | string[];
}
