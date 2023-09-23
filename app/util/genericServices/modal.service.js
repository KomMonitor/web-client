import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
export let ModalService = class ModalService {
    constructor() {
        this.startGuidedTourSubject = new Subject();
        this.startGuidedTour$ = this.startGuidedTourSubject.asObservable();
    }
    startGuidedTour() {
        this.startGuidedTourSubject.next();
    }
};
ModalService = __decorate([
    Injectable({
        providedIn: 'root',
    })
], ModalService);
//# sourceMappingURL=modal.service.js.map