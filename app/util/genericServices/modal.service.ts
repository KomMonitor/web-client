import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private startGuidedTourSubject = new Subject<void>();

  startGuidedTour$ = this.startGuidedTourSubject.asObservable();

  startGuidedTour(): void {
    this.startGuidedTourSubject.next();
  }
}
