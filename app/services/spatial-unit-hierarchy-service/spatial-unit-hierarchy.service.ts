import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  SpatialUnitHierarchyMembersType,
  SpatialUnitHierarchyOverviewType,
} from 'components/ngComponents/models/spatial-units.models';
import { catchError, firstValueFrom, of } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Resolves the spatial-unit hierarchies shown as the legend's "Hierachie" buttons,
 * against the Data Management API's .../spatial-unit-hierarchies endpoints (protected,
 * authenticated automatically via AuthInterceptor).
 *
 * Not every KomMonitor instance has these endpoints deployed yet, so a failed request
 * (network error, 404, ...) falls back to a local mock instead of breaking the legend.
 */
const MOCK_HIERARCHIES: SpatialUnitHierarchyOverviewType[] = [
  {
    hierarchyId: 'f09ae60b-f32a-46b2-a198-501cdab4a3e0',
    isPublic: false,
    mandantId: '9617b330-bd96-43b3-882c-2b26fbd8e9ef',
    name: 'Sozialraum',
  },
];

const MOCK_HIERARCHY_MEMBERS: Record<string, SpatialUnitHierarchyMembersType> = {
  'f09ae60b-f32a-46b2-a198-501cdab4a3e0': {
    hierarchyId: 'f09ae60b-f32a-46b2-a198-501cdab4a3e0',
    isPublic: false,
    mandantId: '9617b330-bd96-43b3-882c-2b26fbd8e9ef',
    name: 'Sozialraum',
    members: [
      {
        hierarchyLevel: 0,
        nextLowerSpatialUnitId: 'acf6f59e-ca73-49c3-9f72-14a9c5e3cc1d',
        nextUpperSpatialUnitId: null,
        spatialUnitId: '06af7d3a-48f5-4cf6-a94a-cdd38f517369',
        spatialUnitLevel: 'Test4',
      },
      {
        hierarchyLevel: 1,
        nextLowerSpatialUnitId: '83a9100f-c447-4119-a16c-4b9132022f49',
        nextUpperSpatialUnitId: '06af7d3a-48f5-4cf6-a94a-cdd38f517369',
        spatialUnitId: 'acf6f59e-ca73-49c3-9f72-14a9c5e3cc1d',
        spatialUnitLevel: 'Test3',
      },
      {
        hierarchyLevel: 2,
        nextLowerSpatialUnitId: '32082424-1fd5-44fd-8609-c3dafc588658',
        nextUpperSpatialUnitId: 'acf6f59e-ca73-49c3-9f72-14a9c5e3cc1d',
        spatialUnitId: '83a9100f-c447-4119-a16c-4b9132022f49',
        spatialUnitLevel: 'Test',
      },
      {
        hierarchyLevel: 3,
        nextLowerSpatialUnitId: null,
        nextUpperSpatialUnitId: '83a9100f-c447-4119-a16c-4b9132022f49',
        spatialUnitId: '32082424-1fd5-44fd-8609-c3dafc588658',
        spatialUnitLevel: 'Test2',
      },
    ],
  },
};

@Injectable({
  providedIn: 'root',
})
export class SpatialUnitHierarchyService {
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  private hierarchiesEndpoint = '/spatial-unit-hierarchies';

  /** All hierarchies available to the current user, for the legend's "Hierachie" buttons. */
  fetchAllHierarchies(): Promise<SpatialUnitHierarchyOverviewType[]> {
    return firstValueFrom(
      this.http
        .get<
          SpatialUnitHierarchyOverviewType[]
        >(this.envConfigService.baseUrlToKomMonitorDataAPI + this.hierarchiesEndpoint)
        .pipe(
          catchError((error) => {
            console.warn(
              'GET .../spatial-unit-hierarchies failed, falling back to mocked hierarchies.',
              error
            );
            return of(MOCK_HIERARCHIES);
          })
        )
    );
  }

  /** Members of one hierarchy (spatial units + their level within it), fetched on demand when it is clicked. */
  fetchHierarchyMembers(hierarchyId: string): Promise<SpatialUnitHierarchyMembersType> {
    return firstValueFrom(
      this.http
        .get<SpatialUnitHierarchyMembersType>(
          this.envConfigService.baseUrlToKomMonitorDataAPI +
            this.hierarchiesEndpoint +
            '/' +
            hierarchyId
        )
        .pipe(
          catchError((error) => {
            console.warn(
              `GET .../spatial-unit-hierarchies/${hierarchyId} failed, falling back to mocked hierarchy members.`,
              error
            );
            return of(
              MOCK_HIERARCHY_MEMBERS[hierarchyId] ?? {
                hierarchyId,
                isPublic: false,
                mandantId: '',
                name: hierarchyId,
                members: [],
              }
            );
          })
        )
    );
  }
}
