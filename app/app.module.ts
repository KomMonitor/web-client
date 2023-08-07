import { DoBootstrap, NgModule, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule, setAngularJSGlobal } from '@angular/upgrade/static';
import { InfoModalModule } from 'components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.module';
import { VersionInfoModule } from 'components/kommonitorUserInterface/kommonitorControls/versionInfo/version-info.module';
import { ajskommonitorCacheHelperServiceProvider,ajskommonitorBatchUpdateHelperServiceProvider,ajskommonitorConfigStorageServiceProvider,ajskommonitorDataExchangeServiceeProvider,ajskommonitorDataGridHelperServiceProvider,ajskommonitorDiagramHelperServiceProvider,ajskommonitorFilterHelperServiceProvider,ajskommonitorKeycloackHelperServiceProvider,ajskommonitorMultiStepFormHelperServiceProvider, ajskommonitorSingleFeatureMapServiceProvider } from 'app-upgraded-providers';

declare var angular: any; // Declare the AngularJS global variable

@NgModule({
  imports: [
    BrowserModule,
    UpgradeModule,
    InfoModalModule,
    VersionInfoModule
  ],
  providers:[
ajskommonitorCacheHelperServiceProvider,ajskommonitorBatchUpdateHelperServiceProvider,
ajskommonitorConfigStorageServiceProvider,ajskommonitorKeycloackHelperServiceProvider,
ajskommonitorMultiStepFormHelperServiceProvider,ajskommonitorDataExchangeServiceeProvider,
ajskommonitorDataGridHelperServiceProvider,ajskommonitorSingleFeatureMapServiceProvider,
ajskommonitorDiagramHelperServiceProvider,ajskommonitorFilterHelperServiceProvider
  ]
  // ...
})
export class AppModule implements DoBootstrap {
  constructor(private upgrade: UpgradeModule, private injector: Injector) {
    setAngularJSGlobal(angular); // Set the AngularJS global object for @angular/upgrade/static
  }

  ngDoBootstrap() {
    // Bootstrap the AngularJS application
    const angularJSModule = angular.module('kommonitorClient', []);
    this.upgrade.bootstrap(document.documentElement, [angularJSModule.name], { strictDi: false });
 }
}
