/**
 * Payload emitted by the indicator management modals through their
 * `@Output() refreshRequested` to ask the management component to refresh the
 * indicator overview table. Replaces the former `RefreshIndicatorOverviewTable`
 * broadcast so the modal ↔ parent contract is typed and no longer routed over
 * the global bus.
 */
export interface IndicatorRefreshRequest {
  crudType: 'add' | 'edit' | 'delete';
  // Optional to mirror the former broadcast payload: on 'add' the id is derived
  // from the API response and may be undefined, in which case the management
  // component falls back to a full metadata refetch.
  targetIndicatorId?: string;
}
