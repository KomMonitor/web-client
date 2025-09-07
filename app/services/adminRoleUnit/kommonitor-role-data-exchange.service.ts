import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { KommonitorDataExchangeService, AccessControlMetadata } from '../adminSpatialUnit/kommonitor-data-exchange.service';

@Injectable({ providedIn: 'root' })
export class KommonitorRoleDataExchangeService {

  constructor(private core: KommonitorDataExchangeService, private http: HttpClient) {}

  // Streams
  get accessControl$() {
    return this.core.accessControl$;
  }

  // State accessors
  get accessControl(): AccessControlMetadata[] {
    return this.core.accessControl;
  }

  get enableKeycloakSecurity(): boolean {
    return this.core.enableKeycloakSecurity;
  }

  get currentKomMonitorLoginRoleNames(): string[] {
    return this.core.currentKomMonitorLoginRoleNames;
  }

  // Fetch methods
  fetchAccessControlMetadata(): Observable<AccessControlMetadata[]> {
    return this.core.fetchAccessControlMetadata();
  }

  get baseUrlToKomMonitorDataAPI(): string {
    return this.core.baseUrlToKomMonitorDataAPI;
  }

  /**
   * Create a new organizational unit in KomMonitor Data API
   */
  createOrganizationalUnit(body: { name: string; description: string; contact: string }): Observable<any> {
    const url = this.core.baseUrlToKomMonitorDataAPI + '/organizationalUnits';
    return this.http.post(url, body);
  }

  // Helpers
  getAllowedRolesString(permissions: any): string {
    return this.core.getAllowedRolesString(permissions);
  }

  getRoleTitle(roleId: string): string {
    return this.core.getRoleTitle(roleId);
  }

  getAccessControlById(id: string): AccessControlMetadata | null {
    return this.core.getAccessControlById(id);
  }

  getAccessControlByName(name: string): AccessControlMetadata | null {
    return this.core.getAccessControlByName(name);
  }

  fetchSingleAccessControlMetadata(id: string): Observable<AccessControlMetadata | null> {
    const cached = this.getAccessControlById(id);
    if (cached) {
      return of(cached);
    }
    return this.fetchAccessControlMetadata().pipe(
      map(() => this.getAccessControlById(id))
    );
  }

  syntaxHighlightJSON(json: any): string {
    return this.core.syntaxHighlightJSON(json);
  }
}


