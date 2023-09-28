angular.module('kommonitorGeocoderHelper', []);

angular
  .module('kommonitorGeocoderHelper', [])
  .service(
    'kommonitorGeocoderHelperService', ['$http', 'Auth', '__env',
    function ($http, Auth, __env) {

      var self = this;
      this.targetUrlToGeocoderInstance = "";

      this.init = async function () {
        this.targetUrlToGeocoderInstance = __env.targetUrlToGeocoderService;
        // extract 'nominatim/' from the URL
        this.targetUrlToGeocoderInstance = this.targetUrlToGeocoderInstance.split("nominatim")[0];
      };

      this.geocodeCSVRows = async function(dataRows, cityProperty, postcodeProperty, streetProperty){
        let queryStrings = [];

        for (const dataRow of dataRows) {
          let queryString = "";

          if(dataRow[streetProperty]){
            queryString += dataRow[streetProperty] + ", ";
          }
          if(dataRow[postcodeProperty]){
            queryString += dataRow[postcodeProperty] + ", ";
          }
          if(dataRow[cityProperty]){
            queryString += dataRow[cityProperty] + ", ";
          }

          if (queryString != ""){
            queryStrings.push(queryString);
          }
        }

        return await this.postBatchGeocoding_queryString(queryStrings);
      }

      this.filterGeocoderBatchResult = function(featuresArray){
        // filter out results with category = building|amenity
        // identify best match for multiple results
        // so result will have max 1 point for each input point
        // but can have 0 points, if no match occurred

        // let acceptedCategories = ["building", "amenity"];
        let resultFeaturesArray = [];
        let highAccuracyValue = 2;
        let lowAccuracyValue = 1;

        for (const featuresEntry of featuresArray) {
          // let featureCandidates = featuresEntry.features.filter(entry => acceptedCategories.includes(entry.properties.category));
          let singleResultArray = [];

          let featureCandidates = featuresEntry.features.filter(entry => entry.properties.geocoderank == highAccuracyValue);

          if(featureCandidates.length == 0){
            featureCandidates = featuresEntry.features.filter(entry => entry.properties.geocoderank == lowAccuracyValue);
          }
          // take first entry
          singleResultArray.push(featureCandidates[0]);
          
          resultFeaturesArray.push(singleResultArray);
        }

        return resultFeaturesArray;
      }

      this.postBatchGeocoding_queryString = async function (queryStrings) {
        try {

          let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          };

          return await $http({
            url: this.targetUrlToGeocoderInstance + "geocoder/geocode/query-string/batch",
            method: 'POST',
            data: queryStrings,
            headers: headers
          }).then(function successCallback(response) {
            // return created job ID
            let featuresArray_filtered = self.filterGeocoderBatchResult(response.data);
            return featuresArray_filtered;
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting geocoding batch request");
            throw error;
          });

        } catch (error) {
          throw error;
        }
      };

      this.init();

    }]);
