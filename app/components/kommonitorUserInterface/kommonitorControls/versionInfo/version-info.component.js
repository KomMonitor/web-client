import { __decorate } from "tslib";
import { Component } from '@angular/core';
export let VersionInfoComponent = class VersionInfoComponent {
    constructor(
    // private kommonitorDataExchangeService: KommonitorDataExchangeService
    ) {
        this.isCollapsed = false;
    }
    ngOnInit() {
        // Initialize any adminLTE box widgets
        this.initializeBoxWidget();
    }
    initializeBoxWidget() {
        $('.box').boxWidget();
    }
};
VersionInfoComponent = __decorate([
    Component({
        selector: 'version-info',
        templateUrl: 'version-info.template.html',
    })
], VersionInfoComponent);
//# sourceMappingURL=version-info.component.js.map