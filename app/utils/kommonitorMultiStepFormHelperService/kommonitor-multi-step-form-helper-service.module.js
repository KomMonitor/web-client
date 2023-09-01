"use strict";
angular.module('kommonitorMultiStepFormHelper', ['kommonitorSingleFeatureMapHelper']);
angular
    .module('kommonitorMultiStepFormHelper', [])
    .service('kommonitorMultiStepFormHelperService', [
    '$http', '__env', '$timeout', 'kommonitorSingleFeatureMapHelperService',
    function ($http, __env, $timeout, kommonitorSingleFeatureMapHelperService) {
        /*
              MULTI STEP FORM STUFF
              */
        //jQuery time
        this.current_fs;
        this.next_fs;
        this.previous_fs; //fieldsets
        this.opacity;
        this.scale; //fieldset properties which we will animate
        this.animating; //flag to prevent quick multi-click glitches
        let self = this;
        this.registerClickHandler = function () {
            this.registerNextButtonClick();
            this.registerPreviousButtonClick();
            this.registerProgressBarItemClick();
        };
        this.registerProgressBarItemClick = function () {
            $timeout(function () {
                $("#progressbar > li").click(function () {
                    let newIndex = $("#progressbar > li").index(this);
                    let oldIndex;
                    let allFs = $($(this).parent().parent().parent().children("fieldset"));
                    let activeFs;
                    for (const fsCandidate of allFs) {
                        if (fsCandidate.style["display"] != "none") {
                            activeFs = fsCandidate;
                            break;
                        }
                    }
                    oldIndex = $("fieldset").index(activeFs);
                    self.current_fs = $($("fieldset").get(oldIndex));
                    if (newIndex == oldIndex) {
                        return;
                    }
                    else if (newIndex < oldIndex) {
                        self.previous_fs = $($("fieldset").get(newIndex));
                        //de-activate current step on progressbar
                        for (let index = oldIndex; index > newIndex; index--) {
                            $($("#progressbar > li").get(index)).removeClass("active");
                        }
                        //show the previous fieldset
                        self.previous_fs.show();
                        self.previous_fs.css({
                            'position': 'relative'
                        });
                        self.current_fs.css({
                            'position': 'absolute'
                        });
                        self.current_fs.hide();
                    }
                    else {
                        self.animating = true;
                        self.next_fs = $($("fieldset").get(newIndex));
                        //activate next step on progressbar using the index of self.next_fs
                        for (let index = oldIndex; index <= newIndex; index++) {
                            $($("#progressbar > li").get(index)).addClass("active");
                        }
                        //show the next fieldset
                        self.next_fs.show();
                        self.next_fs.css({
                            'position': 'relative'
                        });
                        self.current_fs.css({
                            'position': 'absolute'
                        });
                        self.current_fs.hide();
                    }
                    // should any page be shown, where there is a single feature edit map then we must ensure that content is zoomed to
                    kommonitorSingleFeatureMapHelperService.invalidateMap();
                    kommonitorSingleFeatureMapHelperService.zoomToDataLayer();
                });
            }, 500);
        };
        this.registerNextButtonClick = function () {
            $timeout(function () {
                $(".next").click(function () {
                    self.current_fs = $(this).parent();
                    self.next_fs = $(this).parent().next();
                    //activate next step on progressbar using the index of self.next_fs
                    $("#progressbar li").eq($("fieldset").index(self.next_fs)).addClass("active");
                    //show the next fieldset
                    self.next_fs.show();
                    self.next_fs.css({
                        'position': 'relative'
                    });
                    self.current_fs.css({
                        'position': 'absolute'
                    });
                    self.current_fs.hide();
                    // should any page be shown, where there is a single feature edit map then we must ensure that content is zoomed to
                    kommonitorSingleFeatureMapHelperService.invalidateMap();
                    kommonitorSingleFeatureMapHelperService.zoomToDataLayer();
                });
            }, 500);
        };
        this.registerPreviousButtonClick = function () {
            $timeout(function () {
                $(".previous").click(function () {
                    self.current_fs = $(this).parent();
                    self.previous_fs = $(this).parent().prev();
                    //de-activate current step on progressbar
                    $("#progressbar li").eq($("fieldset").index(self.current_fs)).removeClass("active");
                    //show the previous fieldset
                    self.previous_fs.show();
                    self.previous_fs.css({
                        'position': 'relative'
                    });
                    self.current_fs.css({
                        'position': 'absolute'
                    });
                    self.current_fs.hide();
                    // should any page be shown, where there is a single feature edit map then we must ensure that content is zoomed to
                    kommonitorSingleFeatureMapHelperService.invalidateMap();
                    kommonitorSingleFeatureMapHelperService.zoomToDataLayer();
                });
            }, 500);
        };
    }
]);
//# sourceMappingURL=kommonitor-multi-step-form-helper-service.module.js.map