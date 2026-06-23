import { Injectable } from '@angular/core';

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
  availableTopics: any[] = [];

  setTopics(topicsArray) {
    this.availableTopics = topicsArray;
  }
}
