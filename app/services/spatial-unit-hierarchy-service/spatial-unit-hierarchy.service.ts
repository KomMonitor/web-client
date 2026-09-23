import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  SpatialUnitHierarchyMembersType,
  SpatialUnitHierarchyOverviewType,
} from 'components/ngComponents/models/spatial-units.models';
import { catchError, firstValueFrom, of } from 'rxjs';
import { AuthService } from 'services/auth-service/auth.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Resolves the spatial-unit hierarchies shown as the legend's "Hierachie" buttons,
 * against the Data Management API's .../spatial-unit-hierarchies endpoints. The
 * protected endpoint requires a token (attached automatically via AuthInterceptor);
 * for anonymous users we go against the public endpoint instead, which only
 * returns hierarchies flagged `isPublic`.
 *
 * Not every KomMonitor instance has these endpoints deployed yet, so a failed request
 * (network error, 404, ...) resolves to "no data" instead of breaking the legend.
 */
@Injectable({
  providedIn: 'root',
})
export class SpatialUnitHierarchyService {
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);
  private authService = inject(AuthService);

  private protectedHierarchiesEndpoint = '/spatial-unit-hierarchies';
  private publicHierarchiesEndpoint = '/public/spatial-unit-hierarchies';

  private get hierarchiesEndpoint(): string {
    return this.authService.isAuthenticated()
      ? this.protectedHierarchiesEndpoint
      : this.publicHierarchiesEndpoint;
  }

  /** All hierarchies available to the current user, for the legend's "Hierachie" buttons. */
  fetchAllHierarchies(): Promise<SpatialUnitHierarchyOverviewType[]> {
    const endpoint = this.hierarchiesEndpoint;
    return firstValueFrom(
      this.http
        .get<
          SpatialUnitHierarchyOverviewType[]
        >(this.envConfigService.baseUrlToKomMonitorDataAPI + endpoint)
        .pipe(
          catchError((error) => {
            console.warn(`GET ...${endpoint} failed.`, error);
            return of([]);
          })
        )
    );
  }

  /** Members of one hierarchy (spatial units + their level within it), fetched on demand when it is clicked. */
  fetchHierarchyMembers(hierarchyId: string): Promise<SpatialUnitHierarchyMembersType | undefined> {
    const endpoint = this.hierarchiesEndpoint + '/' + hierarchyId;
    return firstValueFrom(
      this.http
        .get<SpatialUnitHierarchyMembersType>(
          this.envConfigService.baseUrlToKomMonitorDataAPI + endpoint
        )
        .pipe(
          catchError((error) => {
            console.warn(`GET ...${endpoint} failed.`, error);
            return of(undefined);
          })
        )
    );
  }
}
