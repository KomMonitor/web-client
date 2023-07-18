import { DoBootstrap, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { InfoModalModule } from 'components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.module';
import { VersionInfoModule } from 'components/kommonitorUserInterface/kommonitorControls/versionInfo/version-info.module';
@NgModule({
  imports: [
    BrowserModule
  ],
 
})
export class AppModule implements DoBootstrap {
    constructor(private upgrade: UpgradeModule) { }
    ngDoBootstrap() {
        this.upgrade.bootstrap(document.documentElement, ['kommonitorClient']);
      }
}