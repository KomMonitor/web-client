import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

export interface LandingpageConfig {
  startPage: string;
  pageName: string | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigStorageService {
  private httpClient = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  postKeycloakConfig(jsonString): Observable<any> {
    console.log('Trying to POST to config storage service to upload new keycloak config.');
    const formdata = new FormData();
    formdata.append('appConfig', new Blob([jsonString], { type: 'application/json' }));

    const headers = new HttpHeaders({ 'Content-Type': '*', Accept: 'text/plain' });

    return this.httpClient.post(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
      formdata,
      { headers: headers }
    );
  }

  postControlsConfig(jsonString): Observable<any> {
    console.log('Trying to POST to config storage service to upload new controls config.');
    const formdata = new FormData();
    formdata.append('appConfig', new Blob([jsonString], { type: 'application/json' }));

    const headers = new HttpHeaders({ Accept: 'text/plain' });

    return this.httpClient.post(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
      formdata,
      { headers: headers }
    );
  }

  postAppConfig(jsString): Observable<any> {
    console.log('Trying to POST to config storage service to upload new app config.');
    const formdata = new FormData();
    formdata.append('appConfig', new Blob([jsString], { type: 'application/javascript' }));

    const headers = new HttpHeaders({ Accept: 'text/plain' });

    return this.httpClient.post(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
      formdata,
      { headers: headers }
    );
  }

  postFilterConfig(jsonString): Observable<any> {
    console.log('Trying to POST to config storage service to upload new filter config.');
    const formdata = new FormData();
    formdata.append('appConfig', new Blob([jsonString], { type: 'application/json' }));

    const headers = new HttpHeaders({ Accept: 'text/plain' });

    return this.httpClient.post(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_filterConfig,
      formdata,
      { headers: headers }
    );
  }

  postLandingpageConfig(landingpageConfig: LandingpageConfig) {
    console.log('Trying to POST to config storage service to upload new landingpage config.');
    const formdata = new FormData();
    formdata.append(
      'startPage',
      new Blob([landingpageConfig.startPage], { type: 'application/json' })
    );
    // only if set
    // formdata.append("pageName", '');

    const headers = new HttpHeaders({ Accept: 'text/plain' });

    return this.httpClient.post(
      this.envConfigService.configStorageServerConfig
        .targetUrlToConfigStorageServer_landingpageConfig,
      formdata,
      { headers: headers }
    );
  }

  getKeycloakConfig(): Observable<any> {
    return this.httpClient.get(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig
    );
  }

  getControlsConfig(): Observable<any> {
    return this.httpClient.get(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig
    );
  }

  getAppConfig(): Observable<any> {
    return this.httpClient.get(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig
    );
  }

  getFilterConfig() {
    return this.httpClient.get(
      this.envConfigService.configStorageServerConfig.targetUrlToConfigStorageServer_filterConfig
    );
  }

  getLandingpageConfig() {
    return this.httpClient.get<any>(
      this.envConfigService.configStorageServerConfig
        .targetUrlToConfigStorageServer_landingpageConfig
    );
  }
}
