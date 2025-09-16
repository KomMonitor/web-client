import { Injectable, Inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KommonitorGeoresourceCacheHelperService {

  constructor(
    @Inject('kommonitorCacheHelperService') private angularJsCacheHelperService: any
  ) {}

  /**
   * Fetches single georesource metadata - delegates to AngularJS service
   */
  async fetchSingleGeoresourceMetadata(georesourceId: string, keycloakRolesArray: string[]): Promise<any> {
    return this.angularJsCacheHelperService.fetchSingleGeoresourceMetadata(georesourceId, keycloakRolesArray);
  }
} 