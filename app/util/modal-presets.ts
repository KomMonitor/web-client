import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

/**
 * The three dialog sizes this application uses.
 *
 * Every `modalService.open` call picks one of these instead of spelling out
 * `size` / `modalDialogClass` / `windowClass` itself. Before this existed, four
 * competing mechanisms were in use side by side (`size: 'lg'` = 800px,
 * `size: 'xl'` = 1140px, `.modal-medium` = 85vw, `.modal-large` = 95vw), which
 * left the same kind of dialog at a different width in every feature area — a
 * delete confirmation was 800px for indicators, 1140px for georesources and
 * 85vw for spatial units.
 *
 * The widths themselves live in `app.scss` next to the `.km-modal-*` classes.
 * Nothing else in the app may set a modal width.
 *
 * Which preset to use:
 * - `MODAL_CONFIRM` — a question with a short summary. Dismissible: Esc and a
 *   backdrop click both mean "cancel".
 * - `MODAL_FORM` — a form or a richer summary, no data grid.
 * - `MODAL_WIDE` — anything holding an ag-grid, a role matrix or a multi-step
 *   wizard. Note that the role dialogs qualify through the shared
 *   `app-role-management-grid` child, not through their own template.
 *
 * `MODAL_FORM` and `MODAL_WIDE` are `backdrop: 'static'` with `keyboard: false`
 * on purpose: they can hold unsaved input, so they close only through their own
 * buttons.
 *
 * All three are `scrollable: true`. Without it a tall dialog simply grew past
 * the viewport and its footer went below the fold — on a 1366x768 laptop the
 * "register group" dialog was 818px tall and its buttons were unreachable
 * without scrolling the whole modal. `scrollable` caps the dialog at the
 * viewport height and scrolls the body instead, keeping header and footer put.
 * It needs the flex bridge in `app.scss` next to the `.km-modal-*` classes to
 * work through the component host element ng-bootstrap inserts.
 */

const SHARED: NgbModalOptions = {
  container: 'body',
  animation: false,
  scrollable: true,
};

export const MODAL_CONFIRM: NgbModalOptions = {
  ...SHARED,
  modalDialogClass: 'km-modal-confirm',
};

export const MODAL_FORM: NgbModalOptions = {
  ...SHARED,
  modalDialogClass: 'km-modal-form',
  backdrop: 'static',
  keyboard: false,
};

export const MODAL_WIDE: NgbModalOptions = {
  ...SHARED,
  modalDialogClass: 'km-modal-wide',
  backdrop: 'static',
  keyboard: false,
};
