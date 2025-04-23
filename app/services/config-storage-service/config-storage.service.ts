import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ajskommonitorConfigStorageServiceProvider } from '../../app-upgraded-providers';
import { Inject, Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigStorageService  {

  pipedData!:any;

  controlsConfig:any;
  
  public constructor(
      @Inject('kommonitorConfigStorageService') private ajskommonitorConfigStorageServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      private httpClient: HttpClient
  ) {
    this.pipedData = this.ajskommonitorConfigStorageServiceProvider;
  }

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

    let headers = new HttpHeaders({ "Content-Type": '*', "Accept": "text/plain" });

    return this.httpClient.post(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig, formdata, {headers: headers});
  }

  postAppConfig(jsString):Observable<any> {
    console.log("Trying to POST to config storage service to upload new app config.");
    var formdata = new FormData();
    formdata.append("appConfig", new Blob([jsString], { type: "application/javascript" }));

    let headers = new HttpHeaders({ "Content-Type": '*', "Accept": "text/plain" });

    return this.httpClient.post(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig, formdata, {headers: headers});
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
}
