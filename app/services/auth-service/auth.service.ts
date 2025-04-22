import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  Auth;

  constructor() { }

  init(auth) {
    
    this.Auth = auth;
  /*   let auth = {
      keycloak: {}
    };

    if (window.__env.enableKeycloakSecurity) {
      var keycloakAdapter = new Keycloak(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig);

      // https://www.keycloak.org/docs/latest/securing_apps/#session-status-iframe
      // https://www.keycloak.org/docs/latest/securing_apps/#_modern_browsers

      keycloakAdapter.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        silentCheckSsoFallback: false
      }).then( (authenticated) => {
        console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!');
        auth.keycloak = keycloakAdapter;
        
        this.newAuth = auth;
        console.log(this.newAuth);
        try {
          console.debug('Trying to bootstrap application.');
        }
        catch (e) {
          console.error('Application bootstrapping failed.');
          console.error(e);
        }
      }).catch(function () {
        console.log('Failed to initialize authentication adapter. Will try to bootstrap application without keycloak security');
        alert('Failed to initialize keycloak authentication adapter. Will try to bootstrap application without keycloak security');
      });
    } */
  }
}
