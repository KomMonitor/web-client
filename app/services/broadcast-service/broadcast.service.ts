import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BroadcastEnvelope, BroadcastMessage } from './broadcast-message';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  constructor() {
    /* intentionally empty */
  }

  // Plain Subject, not BehaviorSubject: this is a one-shot event bus, not sticky state.
  // A BehaviorSubject replays its last emission to every new subscriber, so any component
  // mounted after some other component fired e.g. IsochronesCalculationFinished would
  // immediately re-run that handler on init against whatever (possibly unrelated/stale)
  // state exists at that later point - which is exactly what broke the reachability
  // scenario wizard when opened after a quick-calculation had run.
  broadcastMsg = new Subject<BroadcastEnvelope>();

  currentBroadcastMsg = this.broadcastMsg.asObservable();

  // Only the typed BroadcastMessage names are accepted; raw strings are rejected
  // by the compiler — see documentation/BROADCAST_SERVICE_ENUM.md.
  broadcast(newMsg: BroadcastMessage, values: any = {}) {
    this.broadcastMsg.next({ msg: newMsg, values: values });
  }
}
