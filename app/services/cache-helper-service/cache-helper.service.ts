import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'services/auth-service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CacheHelperServiceService implements OnInit{

  lastDatabaseModificationInfo;
  baseUrlToKomMonitorDataAPI = window.__env.apiUrl + window.__env.basePath;

  localStorageKey_prefix = window.__env.localStoragePrefix;

  localStorageKey_accessControl = this.localStorageKey_prefix + "_lastModification_accessControl";
  localStorageKey_topics = this.localStorageKey_prefix + "_lastModification_topics";
  localStorageKey_spatialUnits = this.localStorageKey_prefix + "_lastModification_spatialUnits";
  localStorageKey_georesources = this.localStorageKey_prefix + "_lastModification_georesources";
  localStorageKey_indicators = this.localStorageKey_prefix + "_lastModification_indicators";
  localStorageKey_processScripts = this.localStorageKey_prefix + "_lastModification_processScripts";

  georesourcesPublicEndpoint = "/public/georesources";
  georesourcesProtectedEndpoint = "/georesources";
  spatialUnitsPublicEndpoint = "/public/spatial-units";
  spatialUnitsProtectedEndpoint = "/spatial-units";
  indicatorsPublicEndpoint = "/public/indicators";
  indicatorsProtectedEndpoint = "/indicators";
  scriptsPublicEndpoint = "/public/process-scripts";
  scriptsProtectedEndpoint = "/process-scripts";
  topicsPublicEndpoint = "/public/topics";
  // only resource that has no public endpoint
  accessControlEndpoint = "/organizationalUnits";

  georesourcesEndpoint = this.georesourcesProtectedEndpoint;
  spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
  indicatorsEndpoint = this.indicatorsProtectedEndpoint;
  scriptsEndpoint = this.scriptsProtectedEndpoint;
  spatialResourceGETUrlPath_forAuthentication = "/public";

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.init();
  }

  checkAuthentication() {
    if (this.authService.Auth.keycloak.authenticated) {
      this.georesourcesEndpoint = this.georesourcesProtectedEndpoint;
      this.spatialUnitsEndpoint = this.spatialUnitsProtectedEndpoint;
      this.indicatorsEndpoint = this.indicatorsProtectedEndpoint;
      this.scriptsEndpoint = this.scriptsProtectedEndpoint;
      this.spatialResourceGETUrlPath_forAuthentication = "";
    } else {
      this.georesourcesEndpoint = this.georesourcesPublicEndpoint;
      this.spatialUnitsEndpoint = this.spatialUnitsPublicEndpoint;
      this.indicatorsEndpoint = this.indicatorsPublicEndpoint;
      this.scriptsEndpoint = this.scriptsPublicEndpoint;
      this.spatialResourceGETUrlPath_forAuthentication = "/public";
    }

  };

  async fetchLastDatabaseModificationObject():Promise<any> {

    try {
      this.lastDatabaseModificationInfo = await firstValueFrom(
        this.http.get(this.baseUrlToKomMonitorDataAPI + "/public/database/last-modification")
      );
    } catch {
      console.error('Unable to load las mod date')
    }
  }

  async fetchResource_fromCacheOrServer(localStorageKey, resourceEndpoint, lastModificationResourceName, keycloakRolesArray, filter:any = undefined) {
    // check if the last modification date within local storage is the same as on the server

    // if YES, then try to use data from cache

    // else set new last modification date, fetch data from server and set that also within localStorage
    //await this.fetchLastDatabaseModificationObject();

    let timestampKey = localStorageKey + "_timestamp";
    let metadataKey = localStorageKey + "_metadata";

    //TODO: why do we need this? There is ever only a single rolesArray why do we need to differentiate between different roles?
    
    if(keycloakRolesArray && keycloakRolesArray.length > 0){
      // admin role is kommonitor-creator
      if(keycloakRolesArray.includes(window.__env.keycloakKomMonitorAdminRoleName)){
        metadataKey += "_" + window.__env.keycloakKomMonitorAdminRoleName;
        timestampKey += "_" + window.__env.keycloakKomMonitorAdminRoleName;
      }
      else{
        metadataKey += "_" + JSON.stringify(keycloakRolesArray);
        timestampKey += "_" + JSON.stringify(keycloakRolesArray);
      }
    }
    else{
      metadataKey += "_public";
      timestampKey += "_public";
    }
    

    let lastModTimestamp_fromCache_string = localStorage.getItem(timestampKey);

    if (lastModTimestamp_fromCache_string && !filter) {
      let lastModTimestamp_fromCache = JSON.parse(lastModTimestamp_fromCache_string);

console.log("HEIRHEIRHEIRHEIHR")
      if (lastModTimestamp_fromCache) {

        let lastModTimestamp_fromServer = this.lastDatabaseModificationInfo[lastModificationResourceName];

        if (lastModTimestamp_fromCache == lastModTimestamp_fromServer) {
          let storageObject_string = localStorage.getItem(metadataKey);

          if (storageObject_string) {
            let storageObject = JSON.parse(storageObject_string);
            return storageObject;
          }
        }
      }
    }


    if(filter) {

      return await this.http.post(this.baseUrlToKomMonitorDataAPI + resourceEndpoint + '/filter',filter).subscribe({
        next: response => {
          return response;
        }
      })
    } else {
      // when code reaches this place we must overwrite/set timestamp and actual metadata

      // persist last modification timestamp object as String in local storage
      localStorage.setItem(timestampKey, JSON.stringify(this.lastDatabaseModificationInfo[lastModificationResourceName]));

      return await this.http.get(this.baseUrlToKomMonitorDataAPI + resourceEndpoint).subscribe({
        next: response => {
          localStorage.setItem(metadataKey, JSON.stringify(response));

          return response;
        },
        error: error => {
          console.log("Unable to read OrgainzationalUnit data");
          return [];
        }
      });
    }
  };

  async fetchAccessControlMetadata(keycloakRolesArray) {
    return await this.fetchResource_fromCacheOrServer(this.localStorageKey_accessControl, this.accessControlEndpoint, "access-control", keycloakRolesArray);
  };

  async fetchTopicsMetadata(keycloakRolesArray) {
    return await this.fetchResource_fromCacheOrServer(this.localStorageKey_topics, this.topicsPublicEndpoint, "topics", keycloakRolesArray);
  };

  async fetchSpatialUnitsMetadata(keycloakRolesArray) {
    return await this.fetchResource_fromCacheOrServer(this.localStorageKey_spatialUnits, this.spatialUnitsEndpoint, "spatial-units", keycloakRolesArray);
  };

  async fetchIndicatorsMetadata(keycloakRolesArray, filter:any = undefined) {
    if (filter) {
      const filterBody = {
        topicIds: filter.indicatorTopics,
        ids: filter.indicators
      } 
      return await this.fetchResource_fromCacheOrServer(this.localStorageKey_indicators, this.indicatorsEndpoint, "indicators", keycloakRolesArray, filterBody);
    } else {
      return await this.fetchResource_fromCacheOrServer(this.localStorageKey_indicators, this.indicatorsEndpoint, "indicators", keycloakRolesArray);
    }
    
  };

  async fetchGeoresourceMetadata(keycloakRolesArray, filter:any = undefined) {
    if (filter) {
      const filterBody = {
        topicIds: filter.georesourceTopics,
        ids: filter.georesources
      } 
      return await this.fetchResource_fromCacheOrServer(this.localStorageKey_georesources, this.georesourcesEndpoint, "georesources", keycloakRolesArray, filterBody);
    } else {
      return await this.fetchResource_fromCacheOrServer(this.localStorageKey_georesources, this.georesourcesEndpoint, "georesources", keycloakRolesArray);
    }
  };

  async fetchProcessScriptsMetadata(keycloakRolesArray) {
    return await this.fetchResource_fromCacheOrServer(this.localStorageKey_processScripts, this.scriptsEndpoint, "process-scripts", keycloakRolesArray);
  };

  fetchSingleAccessControlMetadata(targetId, keycloakRolesArray) {

    return this.http.get(this.baseUrlToKomMonitorDataAPI + this.accessControlEndpoint + "/" + targetId).subscribe({
      next: response => {
        this.fetchAccessControlMetadata(keycloakRolesArray);
        return response;
      }
    });
  };

  fetchSingleSpatialUnitMetadata(targetSpatialUnitId, keycloakRolesArray) {

    return this.http.get(this.baseUrlToKomMonitorDataAPI + this.spatialUnitsEndpoint + "/" + targetSpatialUnitId).subscribe({
      next: response => {
        this.fetchSpatialUnitsMetadata(keycloakRolesArray);
        return response;
      }
    });
  };

  fetchSingleGeoresourceMetadata(targetGeoresourceId, keycloakRolesArray) {

    return this.http.get(this.baseUrlToKomMonitorDataAPI + this.georesourcesEndpoint + "/" + targetGeoresourceId).subscribe({
      next: response => {
        
        this.fetchGeoresourceMetadata(keycloakRolesArray);
        return response;
      }
    });
  };

  fetchSingleIndicatorMetadata(targetIndicatorId, keycloakRolesArray) {

    return this.http.get(this.baseUrlToKomMonitorDataAPI + this.indicatorsEndpoint + "/" + targetIndicatorId).subscribe({
      next: response => {
        
        this.fetchIndicatorsMetadata(keycloakRolesArray);
        return response;
      }
    });
  };

  fetchSingleIndicatorScriptMetadata(targetScriptId, keycloakRolesArray) {
    
    return this.http.get(this.baseUrlToKomMonitorDataAPI + this.scriptsEndpoint + "/" + targetScriptId).subscribe({
      next: response => {
        
        this.fetchProcessScriptsMetadata(keycloakRolesArray);
        return response;
      }
    });
  };

  fetchSingleGeoresourceSchema(targetGeoresourceId) {

    return this.http.get(this.baseUrlToKomMonitorDataAPI + this.georesourcesEndpoint + "/" + targetGeoresourceId + "/schema").subscribe({
      next: response => {
        
        return response;
      }
    });
  };

  fetchSingleGeoresourceWithoutGeometry(targetGeoresourceId) {

    return this.http.get(this.baseUrlToKomMonitorDataAPI + this.georesourcesEndpoint + "/" + targetGeoresourceId + "/allFeatures/without-geometry").subscribe({
      next: response => {
        
      return response;
      }
    });
  };

  async init() {
    this.checkAuthentication();

    await this.fetchLastDatabaseModificationObject();
  };
}
