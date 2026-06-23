import { Injectable, inject } from '@angular/core';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';

@Injectable({
  providedIn: 'root',
})
export class KommonitorIndicatorCacheHelperService {
  private angularJsCacheHelperService = inject(CacheHelperServiceService);

  /**
   * Fetches single indicator metadata - delegates to AngularJS service
   */
  async fetchSingleIndicatorMetadata(
    indicatorId: string,
    keycloakRolesArray: string[]
  ): Promise<any> {
    return this.angularJsCacheHelperService.fetchSingleIndicatorMetadata(
      indicatorId,
      keycloakRolesArray
    );
  }
}
