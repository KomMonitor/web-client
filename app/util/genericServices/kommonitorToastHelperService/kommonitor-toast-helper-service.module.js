angular.module('kommonitorToastHelper', []);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 *
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 *
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular
  .module('kommonitorToastHelper', [])
  .service(
    'kommonitorToastHelperService', [
    function () {

      toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "4000",
        "hideDuration": "3000",
        "timeOut": "7000",
        "extendedTimeOut": "3000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }

      this.displaySuccessToast = function(toastTitle, toastContent){
        toastr.success(toastContent, toastTitle);
      }

      this.displayInfoToast = function(toastTitle, toastContent){
        toastr.info(toastContent, toastTitle);
      }

      this.displayWarningToast = function(toastTitle, toastContent){
        toastr.warning(toastContent, toastTitle);
      }

      this.displayErrorToast = function(toastTitle, toastContent){
        toastr.error(toastContent, toastTitle);
      }

      this.displaySuccessToast_upperLeft = function(toastTitle, toastContent){
        toastr.success(toastContent, toastTitle, {positionClass: "toast-top-left"});
      }

      this.displayInfoToast_upperLeft = function(toastTitle, toastContent){
        toastr.info(toastContent, toastTitle, {positionClass: "toast-top-left"});
      }

      this.displayWarningToast_upperLeft = function(toastTitle, toastContent){
        toastr.warning(toastContent, toastTitle, {positionClass: "toast-top-left"});
      }

      this.displayErrorToast_upperLeft = function(toastTitle, toastContent){
        toastr.error(toastContent, toastTitle, {positionClass: "toast-top-left"});
      }

      this.displaySuccessToast_upperRight = function(toastTitle, toastContent){
        toastr.success(toastContent, toastTitle, {positionClass: "toast-top-right"});
      }

      this.displayInfoToast_upperRight = function(toastTitle, toastContent){
        toastr.info(toastContent, toastTitle, {positionClass: "toast-top-right"});
      }

      this.displayWarningToast_upperRight = function(toastTitle, toastContent){
        toastr.warning(toastContent, toastTitle, {positionClass: "toast-top-right"});
      }

      this.displayErrorToast_upperRight = function(toastTitle, toastContent){
        toastr.error(toastContent, toastTitle, {positionClass: "toast-top-right"});
      }
    }]);
