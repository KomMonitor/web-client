import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { KommonitorRoleDataExchangeService } from './kommonitor-role-data-exchange.service';
import { AccessControlMetadata } from '../adminSpatialUnit/kommonitor-data-exchange.service';

@Injectable({ providedIn: 'root' })
export class KommonitorRoleCacheHelperService {

  constructor(private roleData: KommonitorRoleDataExchangeService) {}

  fetchSingleAccessControlMetadata(id: string): Observable<AccessControlMetadata | null> {
    return this.roleData.fetchSingleAccessControlMetadata(id);
  }
}


