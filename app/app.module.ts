
import { DoBootstrap, NgModule, Version, inject, Input, Inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { downgradeComponent } from '@angular/upgrade/static';

import $ from 'jquery';
import Keycloak from 'keycloak-js';
import angular from "angular";

import { RouterModule, Routes } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { InfoModalComponent } from 'components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.component';
import { VersionInfoComponent } from 'components/kommonitorUserInterface/kommonitorControls/versionInfo/version-info.component';
// import { InfoModalModule } from 'components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.module';
// import { VersionInfoModule } from 'components/kommonitorUserInterface/kommonitorControls/versionInfo/version-info.module';
import { ajskommonitorCacheHelperServiceProvider,ajskommonitorBatchUpdateHelperServiceProvider,ajskommonitorConfigStorageServiceProvider,ajskommonitorDataExchangeServiceeProvider,ajskommonitorDataGridHelperServiceProvider,ajskommonitorDiagramHelperServiceProvider,ajskommonitorFilterHelperServiceProvider,ajskommonitorKeycloackHelperServiceProvider,ajskommonitorMultiStepFormHelperServiceProvider, ajskommonitorSingleFeatureMapServiceProvider } from 'app-upgraded-providers';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalComponent } from 'components/Test/test-modal.component';


// currently the AngularJS routing is still used as part of kommonitorClient module
const routes: Routes = [];

declare var MathJax;

@NgModule({
  imports: [
    BrowserModule,
    UpgradeModule,
    RouterModule.forRoot(routes , { useHash: true }),
    VersionInfoComponent,
    NgbdModalComponent
    // InfoModalModule,
    // VersionInfoModule
  ],
  providers:[
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    ajskommonitorCacheHelperServiceProvider,ajskommonitorBatchUpdateHelperServiceProvider,
    ajskommonitorConfigStorageServiceProvider,ajskommonitorKeycloackHelperServiceProvider,
    ajskommonitorMultiStepFormHelperServiceProvider,ajskommonitorDataExchangeServiceeProvider,
    ajskommonitorDataGridHelperServiceProvider,ajskommonitorSingleFeatureMapServiceProvider,
    ajskommonitorDiagramHelperServiceProvider,ajskommonitorFilterHelperServiceProvider,
    NgbModule
  ],
  declarations: [
    InfoModalComponent
  ]
})

export class AppModule implements DoBootstrap {

  private env: any = {};

  constructor(private upgrade: UpgradeModule) {

  }
  async ngDoBootstrap() {

    this.checkBrowser();

    await this.loadConfigs();
    // instantiate env variable 
    this.env = window.__env || {};

    this.downgradeDependencies();

    // initialize kommonitorClient module
    await this.initKomMonitorClientModule();

    // init keycloak authentication
    await this.initKeycloak();

    this.upgrade.bootstrap(document.documentElement, ['kommonitorClient']);
    // setUpLocationSync(this.upgrade);

  }

  private downgradeDependencies(): void {  

    // to inject already upgraded KomMonitor Angular components into "old" AngluarJS components, we must do 2 things
    // 1. downgrade the new Angular component and register it as directive within each requiring AngularJS module/component
    //    --> this especially means all components, where the downgraded component is used within the HTML part as directive
    // 2. in order to prevent no module errors we must remove the old module reference within the .module file of the AngularJS modules/components 
    angular.module('kommonitorUserInterface')
    .directive('ngbd-modal-component',  downgradeComponent({ component: NgbdModalComponent }) as angular.IDirectiveFactory);

    angular.module('kommonitorUserInterface')
    .directive('infoModal',  downgradeComponent({ component: InfoModalComponent }) as angular.IDirectiveFactory);

   /*  angular.module('kommonitorUserInterface')
    .directive('versionInfo',  downgradeComponent({ component: VersionInfoComponent }) as angular.IDirectiveFactory);
 */
    console.log("registered downgraded Angular components for AngularJS usage");
  }

  private checkBrowser(): void {
    if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
      // This is internet explorer 9, 10 or 11
      window.alert('Internet Explorer erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
    }


    if (/Edge\/\d./i.test(navigator.userAgent)) {
      // This is Microsoft Edge

      window.alert('Microsoft Edge erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
    }
  }

  private async loadConfigs(): Promise<any> {

    console.log("start loading required config files");

    let self = this;

    await $.when(this.ajaxCall_keycloakConfig_localBackup(window.__env.configStorageServerConfig), this.ajaxCall_controlsConfig_localBackup(window.__env.configStorageServerConfig)).then(async function (ajax1Results, ajax2Results) {
      console.log("local backup configs have been loaded in case config server is not reachable.");

      await self.ajaxCall_configServerFile();
      // error

    }, async function () {
      // on fail
      console.log("all configs have been loaded - at least some from local backup values. See console log for details");

      await self.ajaxCall_configServerFile();
      // error
    });

  };

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

  private ajaxCall_configServerFile(): JQuery.jqXHR<any> {
    let self = this;
    return $.ajax({
      url: "./config/config-storage-server.json",
      success: function (result) {
        window.__env = window.__env || {};
        window.__env.configStorageServerConfig = result;

        // inject script tag dynamically to DOM to load ENV variables
        console.log("dynamically load env.js");
        const event = self.loadAppConfigScriptDynamically(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig)
          .then(() => { console.log("loaded"); })
          .catch(() => {
            console.log("Error while loading app config from client config storage server. Will use defaults instead");
            alert("Error while loading app config from client config storage server. Will use defaults instead.");
          });


        return $.when(self.ajaxCall_keycloakConfig(window.__env.configStorageServerConfig), self.ajaxCall_controlsConfig(window.__env.configStorageServerConfig), self.ajaxCall_appConfig(window.__env.configStorageServerConfig)).then(function (ajax1Results, ajax2Results, ajax3Results) {
          console.log("all configs have been loaded");

          self.initEnvVariables();

          return;
        }, function () {
          // on fail
          console.log("all configs have been loaded - at least some from local backup values. See console log for details");

          self.initEnvVariables();

          return;
        });
      }
    });
  }

  private initKomMonitorClientModule(): void {
    let self = this;

    // Register environment in AngularJS as constant
    angular.module('kommonitorClient').constant('__env', window.__env);

    // MathJx directive
    angular.module('kommonitorClient').directive("mathjaxBind", function () {
      return {
        restrict: "EA",
        controller: [
          "$scope",
          "$element",
          "$attrs",
          function ($scope, $element, $attrs) {
            $scope.$watch($attrs.mathjaxBind, function (texExpression) {
              $element.html(texExpression);
              // only if texExpression contains the special character '$' which is used to mark tex code
              // then call MathJax function
              if (texExpression && texExpression.includes("$")) {
                MathJax.typesetPromise([$element[0]]);
              }
            });
          },
        ],
      };
    });

    // custom unique filter
    angular.module('kommonitorClient').filter('unique', function () {
        return function (collection, primaryKey) { //no need for secondary key
            var output :string[] = [],
                keys :string[] = [];
            var splitKeys = primaryKey.split('.'); //split by period


            angular.forEach(collection, function (item: string) {
                let key :string = "";
                angular.copy(item, key);
                for (var i = 0; i < splitKeys.length; i++) {
                    key = key[splitKeys[i]]; 
                }

                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                    output.push(item);
                }
            });

            return output;
        };
    });

    angular.module('kommonitorClient').service("ControlsConfigService", ['$http', function ($http) {
      window.__env.config = null;

      // var resourcePath = window.__env.configStorageServerConfig ? window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig : './config/controls-config_backup.json';
      var resourcePath = './config/controls-config_backup.json';
      var promise = $http.get(resourcePath).then(function (response) {
        // window.__env.config = response.data;
        window.__env.config = window.__env.controlsConfig;
      });

      return {
        promise: promise,
        setData: function (response) {
          window.__env.config = window.__env.controlsConfig;
        },
        getControlsConfig: function () {
          return window.__env.config;
        }
      };
    }]);

    // init/configure SPA routing
    angular.module('kommonitorClient').
      config(['$routeProvider', '$locationProvider',
        function config($routeProvider, $locationProvider) {
          $locationProvider.hashPrefix('!');

          $routeProvider.
            when('/', {
              template: '<kommonitor-user-interface></kommonitor-user-interface>',
              resolve: {
                "ControlsConfigService": function (ControlsConfigService) {
                  return ControlsConfigService.promise;
                }
              }
            }).
            when('/administration', {
              template: '<kommonitor-admin></kommonitor-admin>',
              resolve: {
                'auth': function (Auth, $q, $location) {
                  if (window.__env.enableKeycloakSecurity) {
                    if (Auth.keycloak.authenticated) {
                      if (Auth.keycloak.tokenParsed
                        && Auth.keycloak.tokenParsed.realm_access
                        && Auth.keycloak.tokenParsed.realm_access.roles
                        && Auth.keycloak.tokenParsed.realm_access.roles.some(role => role.endsWith("-creator") || role.endsWith("-publisher") || role.endsWith("-editor"))) {
                        Auth.keycloak.showAdminView = true;
                      }
                      if (Auth.keycloak.showAdminView) {
                        return true;
                      } else {
                        return $q.reject('Not Authenticated');
                      }
                    }
                    else {
                      Auth.keycloak.login({
                        redirectUri: $location.absUrl()
                      });
                    }
                  }

                }
              }
            })
            .otherwise('/');
        }
      ]);

    // register auth interceptor to refresh Keycloak login on each user request 
    angular.module('kommonitorClient').factory('authInterceptor', ['$q', 'Auth', function ($q, Auth) {
      return {
        request: function (config) {
          var deferred = $q.defer();
          if (Auth.keycloak.token && self.urlRequiresKeycloakAuthHeader(config.url)) {
            Auth.keycloak.updateToken(5).then(function () {
              config.headers = config.headers || {};
              config.headers.Authorization = 'Bearer ' + Auth.keycloak.token;
              deferred.resolve(config);
            }).catch(function () {
              deferred.reject('Failed to refresh token');
              console.error('Failed to refresh token. Will redirect to Login screen');
              Auth.keycloak.login();
            });
            return deferred.promise;
          } else {
            return config;
          }
        }
      };
    }]);

    angular.module('kommonitorClient').config(['$httpProvider', function ($httpProvider) {
      $httpProvider.interceptors.push('authInterceptor');
    }]);

  }

  private urlRequiresKeycloakAuthHeader(url: String): boolean {
    // /admin/ is used to make admin requests against keycloak
    if (url.includes("/admin/")) {
      return false;
    }
    // ORS isochrones and directions requests
    if (url.includes("isochrones")) {
      return false;
    }
    if (url.includes("routes")) {
      return false;
    }

    // for KomMonitor public requests we do not need any authentication
    if (url.includes("/public/")) {
      return false;
    }

    return true;
  };



  private isBase64(str: string): boolean {
    var notBase64 = /[^A-Z0-9+\/=]/i;

    const len = str.length;
    if (!len || len % 4 !== 0 || notBase64.test(str)) {
      return false;
    }
    const firstPaddingChar = str.indexOf('=');
    return firstPaddingChar === -1 ||
      firstPaddingChar === len - 1 ||
      (firstPaddingChar === len - 2 && str[len - 1] === '=');

  };

  // private decryptAesCBC(encryptedString: string) {

  //   var hashedKey = CryptoJS.SHA256(this.env.encryption.password);

  //   // from BASE64 encoded encrypted string
  //   var encryptedWordArray = CryptoJS.enc.Base64.parse(encryptedString);

  //   // get IV from beginning
  //   var iv = CryptoJS.lib.WordArray.create(
  //     encryptedWordArray.words.slice(0, (this.env.encryption.ivLength_byte) / 4)
  //   );

  //   var decrypted = CryptoJS.AES.decrypt(
  //     {
  //       ciphertext: CryptoJS.lib.WordArray.create(
  //         encryptedWordArray.words.slice(this.env.encryption.ivLength_byte / 4)
  //       )
  //     },
  //     hashedKey,
  //     { iv: iv }
  //   );

  //   var decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

  //   var decryptedJson = JSON.parse(decryptedString);

  //   // sometimes a response might still be BASE64 encoded in addition
  //   // if so, then resolve that
  //   if (typeof decryptedJson === 'string' && this.isBase64(decryptedJson)) {
  //     decryptedJson = CryptoJS.enc.Base64.parse(decryptedJson).toString(CryptoJS.enc.Utf8);
  //     decryptedJson = JSON.parse(decryptedJson);
  //   }

  //   return decryptedJson;
  // };

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
      }).then(function (authenticated) {
        console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!');
        auth.keycloak = keycloakAdapter;
        angular.module('kommonitorClient').factory('Auth', function () {
          return auth;
        });
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

}