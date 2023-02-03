angular.module('kommonitorSpatialDataProcessor', ['kommonitorDataExchange']);

angular
  .module('kommonitorSpatialDataProcessor', [])
  .service(
    'kommonitorSpatialDataProcessorService', ['$rootScope', '$timeout', 'kommonitorDataExchange', '$http', 'Auth', '__env',
    function ($rootScope, $timeout, kommonitorDataExchangeService, $http, Auth,__env) {

      //TODO: Set this up via env_
      this.processorBaseUrl = "";
        
      // Get list of all available processes
      this.getProcessList = async function(){
        return await $http({
          url: this.processorBaseUrl + "/processes",
          method: "GET"
        }).then(function successCallback(response) {
            return response.data;
          }, function errorCallback(error) {
            console.error("Error while fetching processes.");
            kommonitorDataExchangeService.displayMapApplicationError(error);
        });
      };

      // Get list of all currently queued/running jobs
      this.getJobList = async function () {
        return await $http({
          url: this.processorBaseUrl + "/jobs",
          method: "GET"
        }).then(function successCallback(response) {
          return response.data;
        }, function errorCallback(error) {
          console.error("Error while fetching processes.");
          kommonitorDataExchangeService.displayMapApplicationError(error);
        });
      };

      // Get information about individual job by uuid
      this.getJob = async function (jobId) {
        return await $http({
          url: this.processorBaseUrl + "/jobs/" + jobId,
          method: "GET"
        }).then(function successCallback(response) {
          return response.data;
        }, function errorCallback(error) {
          console.error("Error while fetching processes.");
          kommonitorDataExchangeService.displayMapApplicationError(error);
        });
      };

      // Get result of job with uuid
      this.getJobResult = async function (jobId) {
        return await $http({
          url: this.processorBaseUrl + "/jobs/" + jobId + "/result",
          method: "GET"
        }).then(function successCallback(response) {
          return response.data;
        }, function errorCallback(error) {
          console.error("Error while fetching processes.");
          kommonitorDataExchangeService.displayMapApplicationError(error);
        });
      };


      // Post a new Job to be processed
      this.postJob = async function(jobDefinition) {
        return await $http({
          url: this.processorBaseUrl + "/jobs",
          method: "POST",
          data: jobDefinition,
          headers: {
            'Content-Type': "application/json",
            'Authorization': "Bearer " + Auth.keycloak.token;
          }
        }).then(function successCallback(response) {
            return response.data;
          }, function errorCallback(response) {
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };
    }]);