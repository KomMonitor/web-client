import { Injectable } from '@angular/core';

import Keycloak from 'keycloak-js';
import { AuthService } from 'services/auth-service/auth.service';
import { KeycloakHelperService } from 'services/keycloak-helper-service/keycloak-helper.service';

@Injectable({
  providedIn: 'root'
})
export class StartupService {

  private env: any = {};

  constructor(
    private authService: AuthService,
    private keycloakHelperService: KeycloakHelperService
  ) { }
  
  async initApp():Promise<void> {

    this.env = window.__env || {};

    console.log("start loading required config files");
    return new Promise(async (resolve) => {
        await this.ajaxCall_configServerFile();
        
        // todo, wait for config, then keycloak
        setTimeout(async () => {
          await this.initKeycloak();
          resolve();
        },1000);
    });
  }
    
  private async initKeycloak(): Promise<any> {

    let auth = {
      keycloak: {}
    };

    if (window.__env.enableKeycloakSecurity) {
      var keycloakAdapter = new Keycloak(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig);

      // https://www.keycloak.org/docs/latest/securing_apps/#session-status-iframe
      // https://www.keycloak.org/docs/latest/securing_apps/#_modern_browsers

      return await keycloakAdapter.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        silentCheckSsoFallback: false
      }).then( (authenticated) => {
        console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!', auth);
        auth.keycloak = keycloakAdapter;

        // hier
        // beides ehemals innerhalb der actory('Auth',  () => { funktion
        this.authService.init(auth);
        this.keycloakHelperService.init();

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
    }
  }
  
  /*
 LOAD CONFIG FILES FROM CONFIG STORAGE SERVER
*/
  private ajaxCall_keycloakConfig(configStorageServerConfig: any): JQuery.jqXHR<any> {
    console.log("try to fetch keycloak config file");
    return $.ajax({
      url: configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
      success: function (result) {
        console.log("keycloak config file fetched");
        window.__env.keycloakConfig = result;
        return;
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        console.log("Use keycloak.json local backup default values");
      }
    });
  }

  private ajaxCall_appConfig(configStorageServerConfig: any): JQuery.jqXHR<any> {
    console.log("try to fetch app config file");
    return $.ajax({
      url: configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
      success: function (result) {
        console.log("app config file fetched");
        window.__env.appConfig = result;
        return;
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        console.log("Use env.js local backup default values");
      }
    });
  }

  private ajaxCall_controlsConfig(configStorageServerConfig: any): JQuery.jqXHR<any> {
    console.log("try to fetch controls config file");
    return $.ajax({
      url: configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
      success: function (result) {
        console.log("controls config file fetched");
        window.__env.controlsConfig = result;
        return;
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        console.log("Use controls-config.json local backup default values that has no widget restrictions.");
      }
    });
  }

  private ajaxCall_filterConfig(configStorageServerConfig:any): JQuery.jqXHR<any> {
    console.log("try to fetch filter config file");
    return  $.ajax({
        url: configStorageServerConfig.targetUrlToConfigStorageServer_filterConfig,
        success: function(result){
          console.log("filter config file fetched");
          window.__env.filterConfig = result;
          return; 
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
          console.log("Use filter-config.json local backup default values that has no widget restrictions.");
        }
    });
  } 

  /*
   LOAD CONFIG FILES FROM LOCAL BACKUP FILES
  */
  private ajaxCall_keycloakConfig_localBackup(configStorageServerConfig: any): JQuery.jqXHR<any> {
    return $.ajax({
      url: "./config/keycloak_backup.json",
      success: function (result) {
        console.log("local keycloak config file with default values fetched");
        window.__env.keycloakConfig = result;
        return;
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        console.log("Error parsing local keycloak.json backup file");
      }
    });
  }

  private ajaxCall_controlsConfig_localBackup(configStorageServerConfig: any): JQuery.jqXHR<any> {
    return $.ajax({
      url: "./config/controls-config_backup.json",
      success: function (result) {
        console.log("local controls-config file with default values fetched");
        window.__env.controlsConfig = result;
        return;
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        console.log("Error parsing local controlsConfig.json backup file");
      }
    });
  }

  private ajaxCall_filterConfig_localBackup(configStorageServerConfig: any): JQuery.jqXHR<any> {
    return  $.ajax({
      url: "./config/filter-config_backup.json",
      success: function(result){
        console.log("local filter-config file with default values fetched");
        window.__env.filterConfig = result;
        return;
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) { 
        console.log("Error parsing local filterConfig.json backup file");
      }
  });
  }


  private loadAppConfigScriptDynamically(scriptUrl: string): Promise<unknown> {
    return new Promise(function (res, rej) {
      let script = document.createElement('script');
      script.src = scriptUrl;
      script.type = 'text/javascript';
      script.onerror = rej;
      script.async = true;
      script.onload = res;
      script.addEventListener('error', rej);
      script.addEventListener('load', res);
      document.head.appendChild(script);
    });
  }

  private initEnvVariables(): void {
    // Import variables if present (from env.js)
    if (window) {
      Object.assign(this.env, window.__env);
    }

    if (!this.env.enableDebug) {
      if (window) {
        window.console.log = function () { };
      }
    }

  }

  private ajaxCall_configServerFile(): Promise<any> {

    return new Promise((resolve, reject) => {
      $.ajax({
        url: "./config/config-storage-server.json",
        success: (result) => {
          window.__env = window.__env || {};
          window.__env.configStorageServerConfig = result;

          // inject script tag dynamically to DOM to load ENV variables
          console.log("dynamically load env.js");
          const event = this.loadAppConfigScriptDynamically(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig)
            .then(() => { console.log("loaded"); })
            .catch(() => {
              console.log("Error while loading app config from client config storage server. Will use defaults instead");
              alert("Error while loading app config from client config storage server. Will use defaults instead.");
            });


          $.when(this.ajaxCall_keycloakConfig(window.__env.configStorageServerConfig), this.ajaxCall_controlsConfig(window.__env.configStorageServerConfig), this.ajaxCall_appConfig(window.__env.configStorageServerConfig), this.ajaxCall_filterConfig(window.__env.configStorageServerConfig)).then((ajax1Results, ajax2Results, ajax3Results) => {
            console.log("all configs have been loaded");

            this.initEnvVariables();

          }, () => {
            // on fail
            console.log("all configs have been loaded - at least some from local backup values. See console log for details");

            this.initEnvVariables();

          });
          resolve('');
        }
      });
    });
  }
}
