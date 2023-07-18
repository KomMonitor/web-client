import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { InfoModalModule } from 'components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.module';
export let AppModule = class AppModule {
    constructor(upgrade) {
        this.upgrade = upgrade;
    }
    ngDoBootstrap() {
        this.upgrade.bootstrap(document.documentElement, ['kommonitorClient']);
    }
};
AppModule = __decorate([
    NgModule({
        imports: [
            BrowserModule, InfoModalModule
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map