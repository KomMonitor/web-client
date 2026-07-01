/**
 * Payload a spatial-unit modal emits to ask the management component to refresh
 * its overview table after a CRUD change.
 *
 * This replaces the former `RefreshSpatialUnitOverviewTable` broadcast: that was
 * a plain modal -> parent notification routed needlessly through the global
 * event bus, even though the management component opens every one of these
 * modals itself and can subscribe to a direct `@Output()` instead.
 */
export interface SpatialUnitRefreshRequest {
  crudType: 'add' | 'edit' | 'delete';
  // Optional to mirror the former broadcast payload: on 'add' the id is derived
  // from the importer response and may be undefined, in which case the
  // management component falls back to a full metadata refetch.
  targetSpatialUnitId?: string | string[];
}
