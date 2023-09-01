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
            "isochrones": JSON.stringify(isochroneGeoJson),
            "spatialUnit": spatialUnitId,
            "indicator": indicatorIdArray,
            "date": targetDate,
            "weighting": weighting
          };

          let headers = {
            'Accept': 'application/json',
            
          };
          if (bearerToken){
            headers['Authorization'] = "Bearer " + bearerToken // Note the appropriate header
          }

          return await $http({
            url: this.targetUrlToSpatialDataProcessorInstance + "jobs",
            method: 'POST',
            data: body,
            headers: headers
          }).then(function successCallback(response) {
            // return created job ID
            return response.data;
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting isochrone statistic request.");
            throw error;
          });

        } catch (error) {
          throw error;
        }
      };

      /*
        {
          "id": "a81da875-2e13-4436-8643-08b532637b07",
          "process": "org.n52.kommonitor.spatialdataprocessor.process.IsochronePruneProcess@323aa6ab",
          "timestamp": "2023-09-01T09:17:20.9885221+02:00",
          "status": "finished"
        }
      */
      this.getJobStatus = async function (jobId) {
        try {
          // get auth token to make authenticated requests
          let bearerToken = Auth.keycloak.token;

          let headers = {
            'Accept': 'application/json',
            
          };
          if (bearerToken){
            headers['Authorization'] = "Bearer " + bearerToken // Note the appropriate header
          }

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
            headers: headers
          }).then(function successCallback(response) {
            // return created job ID
            return response.data;
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching job status.");
            throw error;
          });

        } catch (error) {
          throw error;
        }
      };

      /*
      {
        "id": "a81da875-2e13-4436-8643-08b532637b07",
        "result": [
          {
            "indicatorId": "eefe288b-0da8-4d30-a2fe-759a9814f9d5",
            "overallCoverage": [
              {
                "range": 300,
                "coverage": [
                  {
                    "date": "2023-01-01",
                    "absoluteCoverage": 350.60593,
                    "relativeCoverage": 0.11357497
                  }
                ]
              }
            ],
            "poiCoverage": [
              {
                "poiFeatureId": "35_5",
                "overallCoverage": [
                  {
                    "date": "2023-01-01",
                    "absoluteCoverage": 6.3172536,
                    "relativeCoverage": 0.0020464053
                  }
                ],
                "spatialUnitCoverage": [
                  {
                    "spatialUnitFeatureId": "7",
                    "coverage": [
                      {
                        "date": "2023-01-01",
                        "absoluteCoverage": 6.3172536,
                        "relativeCoverage": 0.0186901
                      }
                    ]
                  }
                ]
              },
              ...
            ]
          }
        ]
      }
      */
      this.getJobResult = async function (jobId) {
        try {
          // get auth token to make authenticated requests
          let bearerToken = Auth.keycloak.token;
          let headers = {
            'Accept': 'application/json',
            
          };
          if (bearerToken){
            headers['Authorization'] = "Bearer " + bearerToken // Note the appropriate header
          }

          /*
          returns
            
          */

          return await $http({
            url: this.targetUrlToSpatialDataProcessorInstance + "jobs/" + jobId + "/result",
            method: 'GET',
            headers: headers
          }).then(function successCallback(response) {
            // return created job ID
            return response.data;
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching job result.");
            throw error;
          });

        } catch (error) {
          throw error;
        }
      };

      this.init();

    }]);
