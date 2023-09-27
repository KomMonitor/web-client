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
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }

      this.displaySuccessToast = function(toastTitle, toastContent){
        toastr.success(toastContent, toastTitle, () => {
          // do something when clicked
        });
      }

      this.displayInfoToast = function(toastTitle, toastContent){
        toastr.info(toastContent, toastTitle, () => {
          // do something when clicked
        });
      }

      this.displayWarningToast = function(toastTitle, toastContent){
        toastr.warning(toastContent, toastTitle, () => {
          // do something when clicked
        });
      }

      this.displayErrorToast = function(toastTitle, toastContent){
        toastr.error(toastContent, toastTitle, () => {
          // do something when clicked
        });
      }
    }]);
