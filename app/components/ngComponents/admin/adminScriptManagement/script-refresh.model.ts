/**
 * Payload emitted by the script management modals through their
 * `@Output() refreshRequested` to ask the management component to refresh the
 * script overview table. Replaces the former `RefreshScriptOverviewTable`
 * broadcast so the modal ↔ parent contract is typed and no longer routed over
 * the global bus.
 */
export interface ScriptRefreshRequest {
  crudType: 'add' | 'delete';
  // Set on 'delete' with the removed script id(s) so the management component
  // can drop them from the store without a full refetch. Omitted on 'add',
  // where the component falls back to a full metadata refetch.
  scriptId?: string | string[];
}
