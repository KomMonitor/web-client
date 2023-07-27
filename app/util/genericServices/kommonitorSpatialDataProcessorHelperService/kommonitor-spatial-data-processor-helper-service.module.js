angular.module('kommonitorSpatialDataProcessorHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorSpatialDataProcessorHelper', [])
  .service(
    'kommonitorSpatialDataProcessorHelperService', ['$http', 'Auth', '__env',
    function ($http, Auth, __env) {

      var self = this;
      this.targetUrlToSpatialDataProcessorInstance = "";
      this.targetProcessName_indicatorReachabilityStatistics = "";

      this.init = async function () {
        this.targetUrlToSpatialDataProcessorInstance = __env.targetUrlToSpatialDataProcessorInstance;
        this.targetProcessName_indicatorReachabilityStatistics = __env.spatialDataProcessor_processName_indicatorReachabilityStatistics;
      };



      this.postNewIsochroneStatistic = async function (indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weighting) {
        try {
          // get auth token to make authenticated requests
          let bearerToken = Auth.keycloak.token;

          /*
          {
            "name": "isochrone-prune",
            "isochrones": {},
            "spatialUnit": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "indicator": [
              "3fa85f64-5717-4562-b3fc-2c963f66afa6"
            ],
            "date": "2023-07-12",
            "weighting": "simple"
          }
          */
          let body = {
            "name": "isochrone-prune",
            "isochrones": isochroneGeoJson,
            "spatialUnit": spatialUnitId,
            "indicator": indicatorIdArray,
            "date": targetDate,
            "weighting": weighting
          };

          return await $http({
            url: this.targetUrlToSpatialDataProcessorInstance + "jobs",
            method: 'POST',
            data: body,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': "Bearer " + bearerToken // Note the appropriate header
            }
          }).then(function successCallback(response) {
            // return created job ID
            return response.data;
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting role to keycloak.");
            throw error;
          });

        } catch (error) {
          throw error;
        }
      };

      this.getJobStatus = async function (jobId) {
        try {
          // get auth token to make authenticated requests
          let bearerToken = Auth.keycloak.token;

          /*
          returns
            {
              "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              "process": "string",
              "timestamp": "2023-07-12T21:16:34.843Z",
              "status": "queued"
            }
          */

          return await $http({
            url: this.targetUrlToSpatialDataProcessorInstance + "jobs/" + jobId,
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': "Bearer " + bearerToken // Note the appropriate header
            }
          }).then(function successCallback(response) {
            // return created job ID
            return response.data;
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting role to keycloak.");
            throw error;
          });

        } catch (error) {
          throw error;
        }
      };

      this.getJobResult = async function (jobId) {
        try {
          // get auth token to make authenticated requests
          let bearerToken = Auth.keycloak.token;

          /*
          returns
            
          */

          return await $http({
            url: this.targetUrlToSpatialDataProcessorInstance + "jobs/" + jobId + "/result",
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': "Bearer " + bearerToken // Note the appropriate header
            }
          }).then(function successCallback(response) {
            // return created job ID
            return response.data;
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting role to keycloak.");
            throw error;
          });

        } catch (error) {
          throw error;
        }
      };

      this.init();

    }]);
