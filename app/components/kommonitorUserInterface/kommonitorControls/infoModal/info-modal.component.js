import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { environment } from 'env_backup';
import { kommonitorDataExchangeServiceFactory } from 'app-upgraded-providers';
export let InfoModalComponent = class InfoModalComponent {
    constructor(modalService) {
        this.modalService = modalService;
        this.isHideGreetings = false;
        this.tab1 = 'null';
        this.customGreetingsContact_name = "Test";
        this.customGreetingsContact_organisation = "Test";
        this.customGreetingsContact_mail = "Test";
        this.customGreetingsTextInfoMessage = "Test";
        this.customGreetingsContact_name = "Test";
        this.customGreetingsContact_organisation = "Test";
        this.customGreetingsContact_mail = "Test";
        this.customGreetingsTextInfoMessage = "Test";
    }
    ngOnInit() {
        this.modalService.startGuidedTour$.subscribe(() => {
            // Call a method to handle the guided tour event
            this.callStartGuidedTour();
        });
        this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeServiceFactory;
        if (!(localStorage.getItem("hideKomMonitorAppGreeting") === "true")) {
            this.isHideGreetings = false;
            $('#infoModal').modal('show');
        }
        else {
            this.isHideGreetings = true;
            $("#changeHideGreetingsInput").prop('checked', true);
        }
        const tab1 = document.getElementById("infoModalTab1");
        if (tab1) {
            tab1.innerHTML = environment.standardInfoModalTabTitle;
            tab1.click();
            tab1.focus();
            if (environment.enableExtendedInfoModal) {
                const tab3 = document.getElementById("infoModalTab3");
                const tab3content = document.getElementById("infoModalTab3Content");
                if (tab3 && tab3content) {
                    tab3.innerHTML = environment.extendedInfoModalTabTitle;
                    tab3content.innerHTML = environment.extendedInfoModalHTMLMessage;
                }
                else {
                    alert("not founde");
                }
            }
            else {
                console.log("content hasnt be loaded");
            }
        }
        setTimeout(() => {
            // You might need to use Angular's change detection instead of $digest
        }, 250);
    }
    onChangeHideGreetings() {
        if (this.isHideGreetings) {
            localStorage.setItem("hideKomMonitorAppGreeting", "true");
        }
        else {
            localStorage.setItem("hideKomMonitorAppGreeting", "false");
        }
    }
    onToggleHideGreetings() {
        this.isHideGreetings = !this.isHideGreetings;
        localStorage.setItem("hideKomMonitorAppGreeting", this.isHideGreetings ? "true" : "false");
    }
    callStartGuidedTour() {
        $('#infoModal').modal('hide');
        this.modalService.startGuidedTour();
    }
    showFeedbackForm() {
        $('#infoModal').modal('hide');
        $('#feedbackModal').modal('show');
    }
};
InfoModalComponent = __decorate([
    Component({
        selector: 'info-modal',
        templateUrl: 'info-modal.template.html',
        styleUrls: ['info-modal.component.css'],
    })
], InfoModalComponent);
//# sourceMappingURL=info-modal.component.js.map