import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BroadcastEnvelope, BroadcastMessage } from './broadcast-message';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  constructor() {
    /* intentionally empty */
  }

  broadcastMsg = new BehaviorSubject<BroadcastEnvelope>({ msg: '', values: undefined });

  currentBroadcastMsg = this.broadcastMsg.asObservable();

  // Only the typed BroadcastMessage names are accepted; raw strings are rejected
  // by the compiler — see documentation/BROADCAST_SERVICE_ENUM.md.
  broadcast(newMsg: BroadcastMessage, values: any = {}) {
    this.broadcastMsg.next({ msg: newMsg, values: values });
  }
}
