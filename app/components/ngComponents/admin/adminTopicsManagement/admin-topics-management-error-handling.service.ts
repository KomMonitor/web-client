import { Injectable, signal } from '@angular/core';

/**
 * Carries the error payload of a failed topic creation from the add form to the
 * alert box of the page.
 *
 * Lives in its own file rather than beside the page component: the add form sits
 * deep inside the tree and would otherwise have to import the page component,
 * which imports the tree — an import cycle that leaves one of the two undefined
 * depending on which file is loaded first.
 */
@Injectable()
export class AdminTopicsManagementErrorHandlingService {
  // Signal-backed behind a getter/setter shim: the add-topic child writes this
  // from an async subscribe callback while the OnPush overview template reads
  // it — the signal read makes the overview re-render without further wiring.
  private readonly _errorMessagePart = signal('');
  get errorMessagePart(): string {
    return this._errorMessagePart();
  }
  set errorMessagePart(value: string) {
    this._errorMessagePart.set(value);
  }
}
