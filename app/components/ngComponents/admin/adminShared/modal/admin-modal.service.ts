import { Injectable, Type, inject } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_CONFIRM } from 'util/modal-presets';

/**
 * What a caller hands a dialog before it renders.
 *
 * Either input values, checked against the dialog's own fields — a renamed
 * `@Input` then fails to compile instead of silently no longer arriving — or a
 * callback for anything beyond plain values: subscribing to an output, calling
 * an init method.
 */
export type ModalSetup<C> = Partial<C> | ((modal: C) => void);

/**
 * Opens the admin area's dialogs.
 *
 * Every dialog used to be opened the same way: `open(...)`, then untyped
 * `componentInstance.x = …` assignments, then a `result` handler next to a
 * rejection handler that only swallowed the dismissal. This service is that
 * pattern once, typed.
 *
 * A dismissal (Esc, backdrop click, the × button) is not an error, so the
 * returned promises never reject for one: `open` resolves with `undefined`,
 * `confirm` with `false`. No dialog in the admin area tells "dismissed" apart
 * from "closed without a value".
 */
@Injectable({ providedIn: 'root' })
export class AdminModalService {
  private readonly modalService = inject(NgbModal);

  /**
   * Opens `component` with one of the presets from `util/modal-presets` and
   * resolves with the value the dialog closed with, or `undefined` if it was
   * dismissed.
   *
   * `R` is not checked against the dialog — `NgbActiveModal.close` is untyped —
   * so name the result type the dialog documents.
   */
  open<C, R = unknown>(
    component: Type<C>,
    options: NgbModalOptions,
    setup?: ModalSetup<C>
  ): Promise<R | undefined> {
    const modalRef = this.modalService.open(component, options);
    const modal = modalRef.componentInstance as C;
    if (typeof setup === 'function') {
      setup(modal);
    } else if (setup) {
      Object.assign(modal as object, setup);
    }
    return modalRef.result.then(
      (result: R) => result,
      () => undefined
    );
  }

  /**
   * Opens a confirmation dialog with `MODAL_CONFIRM` and resolves `true` only
   * if the dialog closed with `true` — a "no" and a dismissal both mean no.
   */
  async confirm<C>(component: Type<C>, setup?: ModalSetup<C>): Promise<boolean> {
    return (await this.open(component, MODAL_CONFIRM, setup)) === true;
  }
}
