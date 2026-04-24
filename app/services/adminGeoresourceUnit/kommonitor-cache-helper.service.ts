import { Injectable, Inject } from '@angular/core';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';

@Injectable({
  providedIn: 'root'
})
export class KommonitorGeoresourceCacheHelperService {

  constructor(
   private angularJsCacheHelperService: CacheHelperServiceService
  ) {}

  /**
   * Fetches single georesource metadata - delegates to AngularJS service
   */
  async fetchSingleGeoresourceMetadata(georesourceId: string, keycloakRolesArray: string[]): Promise<any> {
    return this.angularJsCacheHelperService.fetchSingleGeoresourceMetadata(georesourceId, keycloakRolesArray);
  }
} 