import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
export let KommonitorConfigStorageService = class KommonitorConfigStorageService {
    constructor(http) {
        this.http = http;
    }
    postKeycloakConfig(jsonString) {
        console.log("Trying to POST to config storage service to upload new keycloak config.");
        const formdata = new FormData();
        formdata.append("appConfig", new Blob([jsonString], { type: "application/json" }));
        return this.http.post(__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig, formdata, {
            headers: { "Accept": "text/plain" },
            responseType: 'text'
        }).pipe(catchError(error => {
            console.error("Error while posting to config storage service.", error);
            return throwError(error);
        }));
    }
    postControlsConfig(jsonString) {
        console.log("Trying to POST to config storage service to upload new controls config.");
        const formdata = new FormData();
        formdata.append("appConfig", new Blob([jsonString], { type: "application/json" }));
        return this.http.post(__env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig, formdata, {
            headers: { "Accept": "text/plain" },
            responseType: 'text'
        }).pipe(catchError(error => {
            console.error("Error while posting to config storage service.", error);
            return throwError(error);
        }));
    }
    postAppConfig(jsString) {
        console.log("Trying to POST to config storage service to upload new app config.");
        const formdata = new FormData();
        formdata.append("appConfig", new Blob([jsString], { type: "application/javascript" }));
        return this.http.post(__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig, formdata, {
            headers: { "Accept": "text/plain" },
            responseType: 'text'
        }).pipe(catchError(error => {
            console.error("Error while posting to config storage service.", error);
            return throwError(error);
        }));
    }
    getKeycloakConfig() {
        return this.http.get(__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig, {
            responseType: 'json'
        }).pipe(catchError(error => {
            console.error("Error while getting keycloak config from config storage service.", error);
            return throwError(error);
        }));
    }
    getControlsConfig() {
        return this.http.get(__env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig, {
            responseType: 'json'
        }).pipe(catchError(error => {
            console.error("Error while getting controls config from config storage service.", error);
            return throwError(error);
        }));
    }
    getAppConfig() {
        return this.http.get(__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig, {
            responseType: 'text'
        }).pipe(catchError(error => {
            console.error("Error while getting app config from config storage service.", error);
            return throwError(error);
        }));
    }
};
KommonitorConfigStorageService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], KommonitorConfigStorageService);
//# sourceMappingURL=kommonitor-config-storage.js.map