import { __decorate } from "tslib";
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionInfoComponent } from './version-info.component'; // Update the path accordingly
export let VersionInfoModule = class VersionInfoModule {
};
VersionInfoModule = __decorate([
    NgModule({
        declarations: [
            VersionInfoComponent
        ],
        imports: [
            CommonModule, BrowserModule
        ],
        exports: [
            VersionInfoComponent
        ],
        bootstrap: [VersionInfoComponent]
    })
], VersionInfoModule);
//# sourceMappingURL=version-info.module.js.map