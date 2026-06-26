import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  BroadcastEnvelope,
  BroadcastMessage,
  DynamicBroadcastMessage,
} from './broadcast-message';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  constructor() {
    /* intentionally empty */
  }

  broadcastMsg = new BehaviorSubject<BroadcastEnvelope>({ msg: '', values: undefined });

  currentBroadcastMsg = this.broadcastMsg.asObservable();

  // Only typed names are accepted: the static BroadcastMessage union plus the
  // dynamically built names from the typed helpers (showLoadingIconFor etc.).
  // Raw strings are rejected by the compiler — see
  // documentation/BROADCAST_SERVICE_ENUM.md.
  broadcast(newMsg: BroadcastMessage | DynamicBroadcastMessage, values: any = {}) {
    this.broadcastMsg.next({ msg: newMsg, values: values });
  }
}
