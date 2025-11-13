import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

export interface LandingpageConfig {
  startPage: string;
  pageName: string | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigStorageService  {

  controlsConfig:any;
  
  public constructor(
      private httpClient: HttpClient
  ) {}

  getConfigs() {
    this.getControlsConfig();
    this.getAppConfig();
    this.getKeycloakConfig();
  }

  postKeycloakConfig(jsonString):Observable<any> {
    console.log("Trying to POST to config storage service to upload new keycloak config.");
    var formdata = new FormData();
    formdata.append("appConfig", new Blob([jsonString], { type: "application/json" }));

    let headers = new HttpHeaders({ "Content-Type": '*', "Accept": "text/plain" });

    return this.httpClient.post(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig, formdata, {headers: headers});
  }

  postControlsConfig(jsonString):Observable<any> {
    console.log("Trying to POST to config storage service to upload new controls config.");
    var formdata = new FormData();
    formdata.append("appConfig", new Blob([jsonString], { type: "application/json" }));

    let headers = new HttpHeaders({"Accept": "text/plain" });

    return this.httpClient.post(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig, formdata, {headers: headers});
  }

  postAppConfig(jsString):Observable<any> {
    console.log("Trying to POST to config storage service to upload new app config.");
    var formdata = new FormData();
    formdata.append("appConfig", new Blob([jsString], { type: "application/javascript" }));

    let headers = new HttpHeaders({"Accept": "text/plain" });

    return this.httpClient.post(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig, formdata, {headers: headers});
  }

  postFilterConfig(jsonString){         

    console.log("Trying to POST to config storage service to upload new filter config.");
    var formdata = new FormData();
    formdata.append("appConfig", new Blob([jsonString], { type: "application/json"}));  
    
    let headers = new HttpHeaders({"Accept": "text/plain" });

    return this.httpClient.post(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_filterConfig, formdata, {headers: headers});
  }

  postLandingpageConfig(landingpageConfig: LandingpageConfig) {

    console.log("Trying to POST to config storage service to upload new landingpage config.");
    var formdata = new FormData();
    formdata.append("startPage", new Blob([landingpageConfig.startPage], { type: "application/json"}));  
    // only if set 
    // formdata.append("pageName", '');
    
    let headers = new HttpHeaders({"Accept": "text/plain" });

    return this.httpClient.post(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_landingpageConfig, formdata, {headers: headers});
  }

  getKeycloakConfig():Observable<any> {

    return this.httpClient.get(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig);
  }

  getControlsConfig() {
    
    this.httpClient.get(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig).subscribe({
      next: response => {
        this.controlsConfig = response;
        console.log(this.controlsConfig);
      },
      error: error => {
        console.error(error);
      }
    });
  }

  getAppConfig():Observable<any> {
    return this.httpClient.get(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig);
  }

  getFilterConfig(){
    return this.httpClient.get(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_filterConfig);
  };

  getLandingpageConfig() {
    return this.httpClient.get<any>(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_landingpageConfig);
  }
}
