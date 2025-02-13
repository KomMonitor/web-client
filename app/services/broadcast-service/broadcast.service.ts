import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BroadcastService {

  constructor() { }

  broadcastMsg = new BehaviorSubject({msg: '', values: {}});

  currentBroadcastMsg = this.broadcastMsg.asObservable();

  broadcast(newMsg:string, values: any = {}) {
    this.broadcastMsg.next({msg: newMsg, values: values});
  }
}
