import { Injectable, Inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorCacheHelperService {

  constructor(
    @Inject('kommonitorCacheHelperService') private angularJsCacheHelperService: any
  ) {}

  /**
   * Fetches single indicator metadata - delegates to AngularJS service
   */
  async fetchSingleIndicatorMetadata(indicatorId: string, keycloakRolesArray: string[]): Promise<any> {
    return this.angularJsCacheHelperService.fetchSingleIndicatorMetadata(indicatorId, keycloakRolesArray);
  }
} 