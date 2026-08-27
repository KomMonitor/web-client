import { Injectable, signal } from '@angular/core';
import { TopicOverviewType } from 'models/data-management-api';

/**
 * Topic metadata store. Extracted in the Prio 7 god-service split.
 *
 * Holds the available topics collection.
 */
@Injectable({
  providedIn: 'root',
})
export class TopicMetadataStoreService {
  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _availableTopics = signal<TopicOverviewType[]>([]);
  get availableTopics(): TopicOverviewType[] {
    return this._availableTopics();
  }
  set availableTopics(value: TopicOverviewType[]) {
    this._availableTopics.set(value);
  }

  setTopics(topicsArray: TopicOverviewType[]) {
    this.availableTopics = topicsArray;
  }
}
