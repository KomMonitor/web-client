import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import {
  LastModificationOverviewType,
  OrganizationalUnitOverviewType,
  ProcessScriptOverviewType,
  SpatialUnitOverviewType,
  TopicOverviewType,
} from 'models/data-management-api';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'services/auth-service/auth.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root',
})
export class CacheHelperServiceService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  lastDatabaseModificationInfo: LastModificationOverviewType | undefined;
  private baseUrlToKomMonitorDataAPI =
    this.envConfigService.apiUrl + this.envConfigService.basePath;

  private localStorageKey_accessControl =
    this.envConfigService.localStoragePrefix + '_lastModification_accessControl';
  private localStorageKey_topics =
    this.envConfigService.localStoragePrefix + '_lastModification_topics';
  private localStorageKey_spatialUnits =
    this.envConfigService.localStoragePrefix + '_lastModification_spatialUnits';
  private localStorageKey_georesources =
    this.envConfigService.localStoragePrefix + '_lastModification_georesources';
  private localStorageKey_indicators =
    this.envConfigService.localStoragePrefix + '_lastModification_indicators';
  private localStorageKey_processScripts =
    this.envConfigService.localStoragePrefix + '_lastModification_processScripts';
  private localStorageKey_services =
    this.envConfigService.localStoragePrefix + '_lastModification_services';

  georesourcesPublicEndpoint = '/public/georesources';
  georesourcesProtectedEndpoint = '/georesources';
  spatialUnitsPublicEndpoint = '/public/spatial-units';
  spatialUnitsProtectedEndpoint = '/spatial-units';
  indicatorsPublicEndpoint = '/public/indicators';
  indicatorsProtectedEndpoint = '/indicators';
  scriptsPublicEndpoint = '/public/process-scripts';
  scriptsProtectedEndpoint = '/process-scripts';
  topicsPublicEndpoint = '/public/topics';
  servicesPublicEndpoint = '/public/web-services';
  servicesProtectedEndpoint = '/web-services';
  // only resource that has no public endpoint
  accessControlEndpoint = '/organizationalUnits';

  georesourcesEndpoint = this.georesourcesProtectedEndpoint;
  spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
  indicatorsEndpoint = this.indicatorsProtectedEndpoint;
  scriptsEndpoint = this.scriptsProtectedEndpoint;
  servicesEndpoint = this.servicesProtectedEndpoint;
  spatialResourceGETUrlPath_forAuthentication = '/public';

  checkAuthentication() {
    if (this.authService.isAuthenticated()) {
      this.georesourcesEndpoint = this.georesourcesProtectedEndpoint;
      this.spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
      this.indicatorsEndpoint = this.indicatorsProtectedEndpoint;
      this.scriptsEndpoint = this.scriptsProtectedEndpoint;
      this.servicesEndpoint = this.servicesProtectedEndpoint;
      this.spatialResourceGETUrlPath_forAuthentication = '';
    } else {
      this.georesourcesEndpoint = this.georesourcesPublicEndpoint;
      this.spatialUnitsEndpoint = this.spatialUnitsPublicEndpoint;
      this.indicatorsEndpoint = this.indicatorsPublicEndpoint;
      this.scriptsEndpoint = this.scriptsPublicEndpoint;
      this.servicesEndpoint = this.servicesPublicEndpoint;
      this.spatialResourceGETUrlPath_forAuthentication = '/public';
    }
  }

  /**
   * Base URL for spatial-resource GET requests against the Data Management API,
   * combining the configured API base URL with the auth-dependent path
   * (`/public` vs ``). Owns this because the auth path lives here.
   */
  getBaseUrlToKomMonitorDataAPI_spatialResource(): string {
    return (
      this.envConfigService.baseUrlToKomMonitorDataAPI +
      this.spatialResourceGETUrlPath_forAuthentication
    );
  }

  async fetchLastDatabaseModificationObject(): Promise<void> {
    try {
      this.lastDatabaseModificationInfo = await firstValueFrom(
        this.http.get<LastModificationOverviewType>(
          this.baseUrlToKomMonitorDataAPI + '/public/database/last-modification'
        )
      );
    } catch {
      console.error('Unable to load las mod date');
    }
  }

  async fetchResource_fromCacheOrServer<T>(
    localStorageKey: string,
    resourceEndpoint: string,
    lastModificationResourceName: keyof LastModificationOverviewType,
    keycloakRolesArray: string[] | undefined,
    filter: any = undefined
  ): Promise<T> {
    // check if the last modification date within local storage is the same as on the server

    // if YES, then try to use data from cache

    // else set new last modification date, fetch data from server and set that also within localStorage
    //await this.fetchLastDatabaseModificationObject();

    let timestampKey = localStorageKey + '_timestamp';
    let metadataKey = localStorageKey + '_metadata';

    //TODO: why do we need this? There is ever only a single rolesArray why do we need to differentiate between different roles?

    if (keycloakRolesArray && keycloakRolesArray.length > 0) {
      // admin role is kommonitor-creator
      if (keycloakRolesArray.includes(this.envConfigService.keycloakKomMonitorAdminRoleName)) {
        metadataKey += '_' + this.envConfigService.keycloakKomMonitorAdminRoleName;
        timestampKey += '_' + this.envConfigService.keycloakKomMonitorAdminRoleName;
      } else {
        metadataKey += '_' + JSON.stringify(keycloakRolesArray);
        timestampKey += '_' + JSON.stringify(keycloakRolesArray);
      }
    } else {
      metadataKey += '_public';
      timestampKey += '_public';
    }

    const lastModTimestamp_fromCache_string = localStorage.getItem(timestampKey);

    // Without the server-side last-modification info (e.g. that request failed) we cannot
    // validate the cached timestamp, so fall through to a fresh server fetch below.
    if (lastModTimestamp_fromCache_string && !filter && this.lastDatabaseModificationInfo) {
      const lastModTimestamp_fromCache = JSON.parse(lastModTimestamp_fromCache_string);

      if (lastModTimestamp_fromCache) {
        const lastModTimestamp_fromServer =
          this.lastDatabaseModificationInfo[lastModificationResourceName];

        if (lastModTimestamp_fromCache == lastModTimestamp_fromServer) {
          const storageObject_string = localStorage.getItem(metadataKey);

          if (storageObject_string) {
            const storageObject = JSON.parse(storageObject_string);
            return storageObject;
          }
        }
      }
    }

    try {
      if (filter) {
        return await firstValueFrom(
          this.http.post<T>(this.baseUrlToKomMonitorDataAPI + resourceEndpoint + '/filter', filter)
        );
      } else {
        // when code reaches this place we must overwrite/set timestamp and actual metadata

        // persist last modification timestamp object as String in local storage.
        // Only possible when we actually have the server-side modification info; otherwise
        // we skip the timestamp (leaving the cache to be revalidated on the next successful load).
        if (this.lastDatabaseModificationInfo) {
          localStorage.setItem(
            timestampKey,
            JSON.stringify(this.lastDatabaseModificationInfo[lastModificationResourceName])
          );
        }

        return await firstValueFrom(
          this.http.get<T>(this.baseUrlToKomMonitorDataAPI + resourceEndpoint)
        ).then((response) => {
          localStorage.setItem(metadataKey, JSON.stringify(response));

          return response;
        });
      }
    } catch (error) {
      console.error('Unable to read OrgainzationalUnit data', error);
      throw error;
    }
  }

  async fetchServices(keycloakRolesArray: string[] | undefined, _filter): Promise<WmsDataset[]> {
    /*  if (filter) {
      const filterBody = {
        topicIds: filter.indicatorTopics + geores,
        ids: filter.indicators + geores
      }
    } */

    return await this.fetchResource_fromCacheOrServer<WmsDataset[]>(
      this.localStorageKey_services,
      this.servicesEndpoint,
      'web-services',
      keycloakRolesArray
    );
  }

  async fetchAccessControlMetadata(
    keycloakRolesArray: string[] | undefined
  ): Promise<OrganizationalUnitOverviewType[]> {
    return await this.fetchResource_fromCacheOrServer<OrganizationalUnitOverviewType[]>(
      this.localStorageKey_accessControl,
      this.accessControlEndpoint,
      'access-control',
      keycloakRolesArray
    );
  }

  async fetchTopicsMetadata(
    keycloakRolesArray: string[] | undefined
  ): Promise<TopicOverviewType[]> {
    return await this.fetchResource_fromCacheOrServer<TopicOverviewType[]>(
      this.localStorageKey_topics,
      this.topicsPublicEndpoint,
      'topics',
      keycloakRolesArray
    );
  }

  /**
   * Drop the cached topics metadata so the next fetch hits the server. Needed after a topics
   * CRUD operation, since the timestamp-based cache is otherwise only invalidated at startup
   * and would keep serving the pre-mutation list.
   */
  invalidateTopicsCache(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.localStorageKey_topics)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  async fetchSpatialUnitsMetadata(
    keycloakRolesArray: string[] | undefined
  ): Promise<SpatialUnitOverviewType[]> {
    return await this.fetchResource_fromCacheOrServer<SpatialUnitOverviewType[]>(
      this.localStorageKey_spatialUnits,
      this.spatialUnitsEndpoint,
      'spatial-units',
      keycloakRolesArray
    );
  }

  async fetchIndicatorsMetadata(
    keycloakRolesArray: string[] | undefined,
    filter: any = undefined
  ): Promise<IndicatorsDataset[]> {
    if (filter) {
      const filterBody = {
        topicIds: filter.indicatorTopics,
        ids: filter.indicators,
      };
      return await this.fetchResource_fromCacheOrServer<IndicatorsDataset[]>(
        this.localStorageKey_indicators,
        this.indicatorsEndpoint,
        'indicators',
        keycloakRolesArray,
        filterBody
      );
    } else {
      return await this.fetchResource_fromCacheOrServer<IndicatorsDataset[]>(
        this.localStorageKey_indicators,
        this.indicatorsEndpoint,
        'indicators',
        keycloakRolesArray
      );
    }
  }

  async fetchGeoresourceMetadata(
    keycloakRolesArray: string[] | undefined,
    filter: any = undefined
  ): Promise<GeoresourcesDataset[]> {
    if (filter) {
      const filterBody = {
        topicIds: filter.georesourceTopics,
        ids: filter.georesources,
      };
      return await this.fetchResource_fromCacheOrServer<GeoresourcesDataset[]>(
        this.localStorageKey_georesources,
        this.georesourcesEndpoint,
        'georesources',
        keycloakRolesArray,
        filterBody
      );
    } else {
      return await this.fetchResource_fromCacheOrServer<GeoresourcesDataset[]>(
        this.localStorageKey_georesources,
        this.georesourcesEndpoint,
        'georesources',
        keycloakRolesArray
      );
    }
  }

  async fetchProcessScriptsMetadata(
    keycloakRolesArray: string[] | undefined
  ): Promise<ProcessScriptOverviewType[]> {
    return await this.fetchResource_fromCacheOrServer<ProcessScriptOverviewType[]>(
      this.localStorageKey_processScripts,
      this.scriptsEndpoint,
      'process-scripts',
      keycloakRolesArray
    );
  }

  // Single-resource fetchers. These used to return the .subscribe()
  // Subscription instead of the payload, so callers that awaited/then-ed them
  // wrote Subscription objects into their stores; they also kicked off a
  // hidden full-list refetch that raced the caller's targeted store update.
  // They now resolve with the fetched resource and nothing else.

  fetchSingleAccessControlMetadata(targetId: string): Promise<OrganizationalUnitOverviewType> {
    return firstValueFrom(
      this.http.get<OrganizationalUnitOverviewType>(
        this.baseUrlToKomMonitorDataAPI + this.accessControlEndpoint + '/' + targetId
      )
    );
  }

  fetchSingleSpatialUnitMetadata(targetSpatialUnitId: string): Promise<SpatialUnitOverviewType> {
    return firstValueFrom(
      this.http.get<SpatialUnitOverviewType>(
        this.baseUrlToKomMonitorDataAPI + this.spatialUnitsEndpoint + '/' + targetSpatialUnitId
      )
    );
  }

  fetchSingleGeoresourceMetadata(targetGeoresourceId: string): Promise<GeoresourcesDataset> {
    return firstValueFrom(
      this.http.get<GeoresourcesDataset>(
        this.baseUrlToKomMonitorDataAPI + this.georesourcesEndpoint + '/' + targetGeoresourceId
      )
    );
  }

  fetchSingleIndicatorMetadata(targetIndicatorId: string): Promise<IndicatorsDataset> {
    return firstValueFrom(
      this.http.get<IndicatorsDataset>(
        this.baseUrlToKomMonitorDataAPI + this.indicatorsEndpoint + '/' + targetIndicatorId
      )
    );
  }

  fetchSingleIndicatorScriptMetadata(targetScriptId: string): Promise<unknown> {
    return firstValueFrom(
      this.http.get(this.baseUrlToKomMonitorDataAPI + this.scriptsEndpoint + '/' + targetScriptId)
    );
  }

  fetchSingleGeoresourceSchema(targetGeoresourceId: string): Promise<unknown> {
    return firstValueFrom(
      this.http.get(
        this.baseUrlToKomMonitorDataAPI +
          this.georesourcesEndpoint +
          '/' +
          targetGeoresourceId +
          '/schema'
      )
    );
  }

  fetchSingleGeoresourceWithoutGeometry(targetGeoresourceId: string): Promise<unknown> {
    return firstValueFrom(
      this.http.get(
        this.baseUrlToKomMonitorDataAPI +
          this.georesourcesEndpoint +
          '/' +
          targetGeoresourceId +
          '/allFeatures/without-geometry'
      )
    );
  }

  async init() {
    this.checkAuthentication();

    await this.fetchLastDatabaseModificationObject();
  }
}
