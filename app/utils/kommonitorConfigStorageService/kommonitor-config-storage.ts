import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KommonitorConfigStorageService {

  constructor(
    private http: HttpClient
  ) { }

  postKeycloakConfig(jsonString: string): Observable<any> {
    console.log("Trying to POST to config storage service to upload new keycloak config.");
    const formdata = new FormData();
    formdata.append("appConfig", new Blob([jsonString], { type: "application/json" }));

    return this.http.post<any>(
      __env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
      formdata,
      {
        headers: { "Accept": "text/plain" },
        responseType: 'text' as 'json'
      }
    ).pipe(
      catchError(error => {
        console.error("Error while posting to config storage service.", error);
        return throwError(error);
      })
    );
  }

  postControlsConfig(jsonString: string): Observable<any> {
    console.log("Trying to POST to config storage service to upload new controls config.");
    const formdata = new FormData();
    formdata.append("appConfig", new Blob([jsonString], { type: "application/json" }));

    return this.http.post<any>(
      __env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
      formdata,
      {
        headers: { "Accept": "text/plain" },
        responseType: 'text' as 'json'
      }
    ).pipe(
      catchError(error => {
        console.error("Error while posting to config storage service.", error);
        return throwError(error);
      })
    );
  }

  postAppConfig(jsString: string): Observable<any> {
    console.log("Trying to POST to config storage service to upload new app config.");
    const formdata = new FormData();
    formdata.append("appConfig", new Blob([jsString], { type: "application/javascript" }));

    return this.http.post<any>(
      __env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
      formdata,
      {
        headers: { "Accept": "text/plain" },
        responseType: 'text' as 'json'
      }
    ).pipe(
      catchError(error => {
        console.error("Error while posting to config storage service.", error);
        return throwError(error);
      })
    );
  }

  getKeycloakConfig(): Observable<any> {
    return this.http.get<any>(
      __env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
      {
        responseType: 'json'
      }
    ).pipe(
      catchError(error => {
        console.error("Error while getting keycloak config from config storage service.", error);
        return throwError(error);
      })
    );
  }

  getControlsConfig(): Observable<any> {
    return this.http.get<any>(
      __env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
      {
        responseType: 'json'
      }
    ).pipe(
      catchError(error => {
        console.error("Error while getting controls config from config storage service.", error);
        return throwError(error);
      })
    );
  }

  getAppConfig(): Observable<any> {
    return this.http.get<any>(
      __env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
      {
        responseType: 'text'
      }
    ).pipe(
      catchError(error => {
        console.error("Error while getting app config from config storage service.", error);
        return throwError(error);
      })
    );
  }
}
