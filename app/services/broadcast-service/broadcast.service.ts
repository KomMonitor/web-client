import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BroadcastMessage } from './broadcast-message';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  constructor() {
    /* intentionally empty */
  }

  broadcastMsg = new BehaviorSubject<any>({ msg: '', values: undefined });

  currentBroadcastMsg = this.broadcastMsg.asObservable();

  // `| string` is a transitional type: it lets not-yet-migrated call-sites keep
  // passing raw strings. Remove it once all senders use BroadcastMessage / the
  // typed helpers (see documentation/BROADCAST_SERVICE_ENUM.md).
  broadcast(newMsg: BroadcastMessage | string, values: any = {}) {
    this.broadcastMsg.next({ msg: newMsg, values: values });
  }
}
