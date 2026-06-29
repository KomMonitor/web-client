import { Injectable, signal } from '@angular/core';

/**
 * Topic metadata store extracted from DataExchangeService
 * (Prio 7 / B6c — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Holds the available topics collection; the DataExchangeService facade re-exposes
 * availableTopics via a getter so its consumers stay unchanged.
 */
@Injectable({
  providedIn: 'root',
})
export class TopicMetadataStoreService {
  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _availableTopics = signal<any[]>([]);
  get availableTopics(): any[] {
    return this._availableTopics();
  }
  set availableTopics(value: any[]) {
    this._availableTopics.set(value);
  }

  setTopics(topicsArray) {
    this.availableTopics = topicsArray;
  }
}
