import { Injectable } from '@angular/core';
import { WmsResourceType } from 'components/ngComponents/models/services.models';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WmsSharedComponentsService {
  private openAddModal$ = new Subject<WmsResourceType>();

  openAddModal(resourceType: WmsResourceType) {
    this.openAddModal$.next(resourceType);
  }

  onOpenAddModal() {
    return this.openAddModal$.asObservable();
  }
}
