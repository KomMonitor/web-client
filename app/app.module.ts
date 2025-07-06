import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { DoBootstrap, NgModule, Version, inject, Input, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { downgradeComponent } from '@angular/upgrade/static';

import $ from 'jquery';
import Keycloak from 'keycloak-js';
import angular from "angular";

import { Router, RouterModule, Routes } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { 
  ajskommonitorCacheHelperServiceProvider,
  ajskommonitorBatchUpdateHelperServiceProvider,
  ajskommonitorConfigStorageServiceProvider,
  ajskommonitorDataExchangeServiceeProvider,
  ajskommonitorDataGridHelperServiceProvider,
  ajskommonitorDiagramHelperServiceProvider,
  ajskommonitorFilterHelperServiceProvider,
  ajskommonitorImporterHelperServiceProvider,
  ajskommonitorKeycloackHelperServiceProvider,
  ajskommonitorMultiStepFormHelperServiceProvider, 
  ajskommonitorSingleFeatureMapServiceProvider,
  ajskommonitorElementVisibilityHelperServiceProvider,
  ajskommonitorShareHelperServiceProvider,
  ajskommonitorVisualStyleHelperServiceProvider, 
  ajskommonitorMapServiceProvider,
  ajskommonitorGenericMapHelperServiceProvider,
  ajskommonitorReachabilityHelperServiceProvider,
  ajskommonitorReachabilityScenarioHelperServiceProvider,
  ajskommonitorReachabilityMapHelperServiceProvider,
  ajskommonitorSingleFeatureMapHelperServiceProvider,
  ajskommonitorScriptHelperServiceProvider,
  ajskommonitorGlobalFilterHelperServiceProvider,
  ajskommonitorFavServiceProvider} from 'app-upgraded-providers';
import { KommonitorLegendComponent } from 'components/ngComponents/userInterface/kommonitorLegend/kommonitor-legend.component';
import { NgbCalendar, NgbDatepickerModule, NgbDateStruct, NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { KommonitorClassificationComponent } from './components/ngComponents/userInterface/kommonitorClassification/kommonitor-classification.component';
import { KommonitorDataSetupComponent } from './components/ngComponents/userInterface/sidebar/kommonitorDataSetup/kommonitor-data-setup.component';
import { SidebarComponent } from './components/ngComponents/userInterface/sidebar/sidebar.component';
import { PoiComponent } from 'components/ngComponents/userInterface/sidebar/poi/poi.component';
import { KommonitorFilterComponent } from './components/ngComponents/userInterface/sidebar/kommonitorFilter/kommonitor-filter.component';
import { KommonitorMapComponent } from './components/ngComponents/userInterface/kommonitorMap/kommonitor-map.component';
import { DualListBoxComponent } from './components/ngComponents/customElements/dual-list-box/dual-list-box.component';
import { KommonitorBalanceComponent } from './components/ngComponents/userInterface/sidebar/kommonitorBalance/kommonitor-balance.component';
import { NouisliderModule } from 'ng2-nouislider';
import { KommonitorDiagramsComponent } from './components/ngComponents/userInterface/sidebar/kommonitorDiagrams/kommonitor-diagrams.component';
import { UserInterfaceComponent } from './components/ngComponents/userInterface/user-interface.component';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { IndicatorRadarComponent } from './components/ngComponents/userInterface/sidebar/indicatorRadar/indicator-radar.component';
import { ClassificationMethodSelectComponent } from './components/ngComponents/common/classificationMethodSelect/classification-method-select.component';
import { IndicatorNameFilter } from 'pipes/indicator-title-filter.pipe';
import { RegressionDiagramComponent } from './components/ngComponents/userInterface/sidebar/regressionDiagram/regression-diagram.component';
import { SelectedIndicatorFilter } from 'pipes/selected-indicator-filter.pipe';
import { BaseIndicatorOfComputedIndicatorFilter } from 'pipes/base-indicator-of-computed-indicator-filter.pipe';
import { BaseIndicatorOfHeadlineIndicatorFilter } from 'pipes/base-indicator-of-headline-indicator-filter.pipe';
import { AuthService } from 'services/auth-service/auth.service';
import { KommonitorReachabilityComponent } from './components/ngComponents/userInterface/sidebar/kommonitorReachability/kommonitor-reachability.component';

import { AdminTopicsManagementComponent } from './components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';
import { TopicEditModalComponent } from './components/ngComponents/admin/adminTopicsManagement/topicEditModal/topic-edit-modal.component';
import { TopicDeleteModalComponent } from './components/ngComponents/admin/adminTopicsManagement/topicDeleteModal/topic-delete-modal.component';
import { AuthInterceptor } from 'util/interceptors/auth.interceptor';
import { IndicatorFavFilter } from 'pipes/indicator-fav-filter.pipe';
import { GeoFavFilter } from 'pipes/georesources-fav-filter.pipe';
import { GeoFavItemFilter } from 'pipes/georesources-fav-item-filter.pipe';

import { AdminAppConfigComponent } from './components/ngComponents/admin/adminConfig/adminAppConfig/admin-app-config.component';
import { AdminControlsConfigComponent } from './components/ngComponents/admin/adminConfig/adminControlsConfig/admin-controls-config.component';
import { AdminRoleExplanationComponent } from './components/ngComponents/admin/adminRoleExplanation/admin-role-explanation.component';
import { AdminDashboardManagementComponent } from './components/ngComponents/admin/adminDashboardManagement/admin-dashboard-management.component';
import { AdminSpatialUnitsManagementComponent } from './components/ngComponents/admin/adminSpatialUnitsManagement/admin-spatial-units-management.component';
import { SpatialUnitAddModalComponent } from './components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitEditMetadataModalComponent } from './components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component';
import { SpatialUnitEditFeaturesModalComponent } from './components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component';
import { SpatialUnitDeleteModalComponent } from './components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitDeleteModal/spatial-unit-delete-modal.component';


// currently the AngularJS routing is still used as part of kommonitorClient module
const routes: Routes = [];

declare var MathJax;

@NgModule({
  imports: [
    BrowserModule,
    UpgradeModule,
    RouterModule.forRoot(routes , { useHash: true }),
    NgbDatepickerModule, 
    NgbAccordionModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    JsonPipe,
    NouisliderModule,
    NgbCollapseModule,
    DualListBoxComponent
  ],
  providers:[
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    ajskommonitorCacheHelperServiceProvider,
    ajskommonitorBatchUpdateHelperServiceProvider,
    ajskommonitorConfigStorageServiceProvider,
    ajskommonitorKeycloackHelperServiceProvider,
    ajskommonitorMultiStepFormHelperServiceProvider,
    ajskommonitorDataExchangeServiceeProvider,
    ajskommonitorDataGridHelperServiceProvider,
    ajskommonitorSingleFeatureMapServiceProvider,
    ajskommonitorDiagramHelperServiceProvider,
    ajskommonitorFilterHelperServiceProvider,
    ajskommonitorImporterHelperServiceProvider,
    ajskommonitorElementVisibilityHelperServiceProvider, 
    ajskommonitorShareHelperServiceProvider,
    ajskommonitorVisualStyleHelperServiceProvider, 
    ajskommonitorMapServiceProvider, 
    ajskommonitorGenericMapHelperServiceProvider, 
    ajskommonitorReachabilityHelperServiceProvider,
    ajskommonitorReachabilityScenarioHelperServiceProvider,
    ajskommonitorReachabilityMapHelperServiceProvider,
    ajskommonitorSingleFeatureMapHelperServiceProvider,
    ajskommonitorScriptHelperServiceProvider,
    ajskommonitorGlobalFilterHelperServiceProvider,
    ajskommonitorFavServiceProvider,
    NgbModule,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    AuthService
  ],
  declarations: [
    KommonitorLegendComponent,
    KommonitorClassificationComponent,
    KommonitorDataSetupComponent,
    SidebarComponent,
    PoiComponent,
    KommonitorFilterComponent,
    KommonitorMapComponent,
    KommonitorBalanceComponent,
    KommonitorDiagramsComponent,
    UserInterfaceComponent,
    IndicatorRadarComponent,
    ClassificationMethodSelectComponent,
    IndicatorNameFilter,
    SelectedIndicatorFilter,
    IndicatorFavFilter,
    GeoFavFilter,
    GeoFavItemFilter,
    BaseIndicatorOfComputedIndicatorFilter,
    BaseIndicatorOfHeadlineIndicatorFilter,
    RegressionDiagramComponent,
    KommonitorReachabilityComponent,
    AdminTopicsManagementComponent,
    TopicEditModalComponent,
    TopicDeleteModalComponent,
    AdminAppConfigComponent,
    AdminControlsConfigComponent,
    AdminRoleExplanationComponent,
    AdminDashboardManagementComponent,
    AdminSpatialUnitsManagementComponent,
    SpatialUnitAddModalComponent,
    SpatialUnitEditMetadataModalComponent,
    SpatialUnitEditFeaturesModalComponent,
    SpatialUnitDeleteModalComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})

export class AppModule implements DoBootstrap {

  private env: any = {};

  constructor(
    private upgrade: UpgradeModule,
    private authService: AuthService
  ) {
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

    // fix for route-mismatch. to be rebuild/deleted with routeModule implementation // todo
    if(window.location.href.includes('administration#!'))
      location.href = `${window.location.origin}/administration#!/administration`;

  }

  private downgradeDependencies(): void {  

    // to inject already upgraded KomMonitor Angular components into "old" AngluarJS components, we must do 2 things
    // 1. downgrade the new Angular component and register it as directive within each requiring AngularJS module/component
    //    --> this especially means all components, where the downgraded component is used within the HTML part as directive
    // 2. in order to prevent no module errors we must remove the old module reference within the .module file of the AngularJS modules/components 

    // IMPORTANT
    // the directive identifier is changed to lower-case with a "-" between word. No idea why... 
    // meaning "infoModal" must be called as <info-modal>.. , "komLegend" as <kom-legend>.... 

    angular.module('kommonitorUserInterface')
    .directive('userInterfaceNew',  downgradeComponent({ component: UserInterfaceComponent }) as angular.IDirectiveFactory);

    angular.module('adminAppConfig')
    .directive('newAdminAppConfig',  downgradeComponent({ component: AdminAppConfigComponent }) as angular.IDirectiveFactory);

    angular.module('adminControlsConfig')
    .directive('adminControlsConfigNew',  downgradeComponent({ component: AdminControlsConfigComponent }) as angular.IDirectiveFactory);

    angular.module('adminRoleExplanation')
      .directive('adminRoleExplanationNew', downgradeComponent({ component: AdminRoleExplanationComponent }) as angular.IDirectiveFactory);



   /*  angular.module('kommonitorUserInterface')
    .directive('kommonitorLegendNew',  downgradeComponent({ component: KommonitorLegendComponent }) as angular.IDirectiveFactory);

    angular.module('kommonitorUserInterface')
    .directive('sidebarNew',  downgradeComponent({ component: SidebarComponent }) as angular.IDirectiveFactory);

    angular.module('kommonitorUserInterface')
    .directive('kommonitorMapNew',  downgradeComponent({ component: KommonitorMapComponent }) as angular.IDirectiveFactory); */

    angular.module('kommonitorAdmin')
      .directive('adminTopicsManagementNew', downgradeComponent({ 
        component: AdminTopicsManagementComponent 
      }) as angular.IDirectiveFactory);

    angular.module('kommonitorAdmin')
      .directive('topicEditModalNew', downgradeComponent({ 
        component: TopicEditModalComponent 
      }) as angular.IDirectiveFactory);

    angular.module('kommonitorAdmin')
      .directive('topicDeleteModalNew', downgradeComponent({ 
        component: TopicDeleteModalComponent 
      }) as angular.IDirectiveFactory);

    angular.module('kommonitorAdmin')
      .directive('adminDashboardManagementNew', downgradeComponent({
        component: AdminDashboardManagementComponent
      }) as angular.IDirectiveFactory);

    angular.module('kommonitorAdmin')
      .directive('adminSpatialUnitsManagementNew', downgradeComponent({
        component: AdminSpatialUnitsManagementComponent
      }) as angular.IDirectiveFactory);

    angular.module('kommonitorAdmin')
      .directive('spatialUnitEditMetadataModalNew', downgradeComponent({
        component: SpatialUnitEditMetadataModalComponent
      }) as angular.IDirectiveFactory);

    angular.module('kommonitorAdmin')
      .directive('spatialUnitEditFeaturesModalNew', downgradeComponent({
        component: SpatialUnitEditFeaturesModalComponent
      }) as angular.IDirectiveFactory);

    angular.module('kommonitorAdmin')
      .directive('spatialUnitDeleteModalNew', downgradeComponent({
        component: SpatialUnitDeleteModalComponent
      }) as angular.IDirectiveFactory);

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

    await $.when(this.ajaxCall_keycloakConfig_localBackup(window.__env.configStorageServerConfig), this.ajaxCall_controlsConfig_localBackup(window.__env.configStorageServerConfig), this.ajaxCall_filterConfig_localBackup(window.__env.configStorageServerConfig)).then(async (ajax1Results, ajax2Results) => {
      console.log("local backup configs have been loaded in case config server is not reachable.");

      await this.ajaxCall_configServerFile();
      // error

    }, async () => {
      // on fail
      console.log("all configs have been loaded - at least some from local backup values. See console log for details");

      await this.ajaxCall_configServerFile();
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

  private ajaxCall_configServerFile(): JQuery.jqXHR<any> {

    return $.ajax({
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


        return $.when(this.ajaxCall_keycloakConfig(window.__env.configStorageServerConfig), this.ajaxCall_controlsConfig(window.__env.configStorageServerConfig), this.ajaxCall_appConfig(window.__env.configStorageServerConfig), this.ajaxCall_filterConfig(window.__env.configStorageServerConfig)).then((ajax1Results, ajax2Results, ajax3Results) => {
          console.log("all configs have been loaded");

          this.initEnvVariables();

          return;
        }, () => {
          // on fail
          console.log("all configs have been loaded - at least some from local backup values. See console log for details");

          this.initEnvVariables();

          return;
        });
      }
    });
  }

  private initKomMonitorClientModule(): void {

    // Register environment in AngularJS as constant
    angular.module('kommonitorClient').constant('__env', window.__env);

    // MathJx directive
    angular.module('kommonitorClient').directive("mathjaxBind", () => {
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
            when('/administration/', {
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
    angular.module('kommonitorClient').factory('authInterceptor', ['$q', 'Auth', ($q, Auth) => {
      return {
        request: (config) => {
          var deferred = $q.defer();
          if (Auth.keycloak.token && this.urlRequiresKeycloakAuthHeader(config.url)) {
            Auth.keycloak.updateToken(5).then(() => {
              config.headers = config.headers || {};
              config.headers.Authorization = 'Bearer ' + Auth.keycloak.token;
              deferred.resolve(config);
            }).catch(() => {
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
      }).then( (authenticated) => {
        console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!');
        auth.keycloak = keycloakAdapter;
        angular.module('kommonitorClient').factory('Auth',  () => {
          this.authService.init(auth);
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