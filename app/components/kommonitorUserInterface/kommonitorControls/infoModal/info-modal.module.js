import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoModalComponent } from './info-modal.component';
import { VersionInfoModule } from '../versionInfo/version-info.module';
export let InfoModalModule = class InfoModalModule {
};
InfoModalModule = __decorate([
    NgModule({
        declarations: [InfoModalComponent],
        imports: [CommonModule, VersionInfoModule],
        exports: [InfoModalComponent],
        bootstrap: [InfoModalComponent]
    })
], InfoModalModule);
//# sourceMappingURL=info-modal.module.js.map