angular.module('kommonitorConfigStorage', ['kommonitorDataExchange']);

angular
  .module('kommonitorConfigStorage', [])
  .service(
    'kommonitorConfigStorageService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env) {

      this.postKeycloakConfig = async function(jsonString){           
	  
        console.log("Trying to POST to config storage service to upload new keycloak config.");
  
        var formdata = new FormData();
        formdata.append("appConfig", new Blob([jsonString], { type: "application/json"}));        
    
        return await $http({
          url: __env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
          method: "POST",
          data: formdata,
          // must set header content-type to undefined in order to send as multipart-formdata
          headers: {"Content-Type": undefined, "Accept": "text/plain" },
          responseType: 'text'
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
      
          return response.data;
      
          }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          //$scope.error = response.statusText;
          console.error("Error while posting to config storage service.");
          throw response;
        });  
      };

      this.postControlsConfig = async function(jsonString){           
	  
        console.log("Trying to POST to config storage service to upload new controls config.");
  
        var formdata = new FormData();
        formdata.append("appConfig", new Blob([jsonString], { type: "application/json"}));        
    
        return await $http({
          url: __env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
          method: "POST",
          data: formdata,
          // must set header content-type to undefined in order to send as multipart-formdata
          headers: {"Content-Type": undefined, "Accept": "text/plain" },
          responseType: 'text'
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
      
          return response.data;
      
          }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          //$scope.error = response.statusText;
          console.error("Error while posting to config storage service.");
          throw response;
        });  
      };

      this.postAppConfig = async function(jsString){           
	  
        console.log("Trying to POST to config storage service to upload new app config.");
  
        var formdata = new FormData();
        formdata.append("appConfig", new Blob([jsString], { type: "application/javascript"}));        
    
        return await $http({
          url: __env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
          method: "POST",
          data: formdata,
          // must set header content-type to undefined in order to send as multipart-formdata
          headers: {"Content-Type": undefined, "Accept": "text/plain" },
          responseType: 'text'
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
      
          return response.data;
      
          }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          //$scope.error = response.statusText;
          console.error("Error while posting to config storage service.");
          throw response;
        });  
      };

      this.getKeycloakConfig = async function(){
        return await $http({
          url: __env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
          method: "GET",
          responseType: 'json'
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
      
          return response.data;
      
          }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          //$scope.error = response.statusText;
          console.error("Error while getting keycloak config from config storage service.");
          throw response;
        });  
      };

      this.getControlsConfig = async function(){
        return await $http({
          url: __env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
          method: "GET",
          responseType: 'json'
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
      
          return response.data;
      
          }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          //$scope.error = response.statusText;
          console.error("Error while getting keycloak config from config storage service.");
          throw response;
        });  
      };

      this.getAppConfig = async function(){
        return await $http({
          url: __env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
          method: "GET",
          responseType: 'text'
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
      
          return response.data;
      
          }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          //$scope.error = response.statusText;
          console.error("Error while getting keycloak config from config storage service.");
          throw response;
        });  
      };

    }]);
