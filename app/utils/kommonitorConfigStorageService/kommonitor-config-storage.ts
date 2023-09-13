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

  /**
   * Uploads a new Keycloak configuration to the configuration storage server.
   * @param jsonString - The Keycloak configuration JSON as a string.
   * @returns An Observable that can be subscribed to for handling the HTTP response or error.
   */
  postKeycloakConfig(jsonString: string): Observable<any> {
    console.log("Trying to POST to config storage service to upload new Keycloak config.");
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

  /**
   * Uploads a new controls configuration to the configuration storage server.
   * @param jsonString - The controls configuration JSON as a string.
   * @returns An Observable that can be subscribed to for handling the HTTP response or error.
   */
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

  /**
   * Uploads a new app configuration to the configuration storage server.
   * @param jsString - The app configuration JavaScript as a string.
   * @returns An Observable that can be subscribed to for handling the HTTP response or error.
   */
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

  /**
   * Retrieves the Keycloak configuration from the configuration storage server.
   * @returns An Observable that can be subscribed to for handling the HTTP response or error.
   */
  getKeycloakConfig(): Observable<any> {
    return this.http.get<any>(
      __env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
      {
        responseType: 'json'
      }
    ).pipe(
      catchError(error => {
        console.error("Error while getting Keycloak config from config storage service.", error);
        return throwError(error);
      })
    );
  }

  /**
   * Retrieves the controls configuration from the configuration storage server.
   * @returns An Observable that can be subscribed to for handling the HTTP response or error.
   */
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

  /**
   * Retrieves the app configuration from the configuration storage server.
   * @returns An Observable that can be subscribed to for handling the HTTP response or error.
   */
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
