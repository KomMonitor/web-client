angular.module('kommonitorDataExchange', ['kommonitorMap']);

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
		.module('kommonitorDataExchange', ['datatables'])
		.service(
				'kommonitorDataExchangeService', ['$rootScope', '$timeout', 'kommonitorMapService', '$http', '__env', 'DTOptionsBuilder', '$q',
				function($rootScope, $timeout,
						kommonitorMapService, $http, __env, DTOptionsBuilder, $q) {

							var numberOfDecimals = __env.numberOfDecimals;
							const DATE_PREFIX = __env.indicatorDatePrefix;
              var defaultColorForZeroValues = __env.defaultColorForZeroValues;
              var defaultColorForNoDataValues = __env.defaultColorForNoDataValues;
              var defaultColorForFilteredValues = __env.defaultColorForFilteredValues;

              const defaultColorForOutliers_high = __env.defaultColorForOutliers_high;
              const defaultBorderColorForOutliers_high = __env.defaultBorderColorForOutliers_high;
              const defaultFillOpacityForOutliers_high = __env.defaultFillOpacityForOutliers_high;
              const defaultColorForOutliers_low = __env.defaultColorForOutliers_low;
              const defaultBorderColorForOutliers_low = __env.defaultBorderColorForOutliers_low;
              const defaultFillOpacityForOutliers_low = __env.defaultFillOpacityForOutliers_low;

          var self = this;

          this.FEATURE_ID_PROPERTY_NAME = __env.FEATURE_ID_PROPERTY_NAME;
          this.FEATURE_NAME_PROPERTY_NAME = __env.FEATURE_NAME_PROPERTY_NAME;
          this.VALID_START_DATE_PROPERTY_NAME = __env.VALID_START_DATE_PROPERTY_NAME;
          this.VALID_END_DATE_PROPERTY_NAME = __env.VALID_END_DATE_PROPERTY_NAME;
          this.indicatorDatePrefix = __env.indicatorDatePrefix;

          this.datatablesOptions = DTOptionsBuilder.newOptions()
      				.withPaginationType('full_numbers')
      				.withDisplayLength(5)
      				.withLanguageSource('//cdn.datatables.net/plug-ins/1.10.15/i18n/German.json')
              .withOption('lengthMenu', [[5, 10, 25, 50, 100, -1], [5, 10, 25, 50, 100, "Alle"]]);

          this.datePickerOptions = {
            autoclose: true,
      			language: 'de',
      			format: 'yyyy-mm-dd'
          };

          this.adminUserName = __env.adminUserName;
          this.adminPassword = __env.adminPassword;
          this.adminIsLoggedIn = false;

          this.availablePoiMarkerColors = [
            {
              "colorName" : "red",
              "colorValue" : "rgb(205,59,40)"
            },
            {
              "colorName" : "white",
              "colorValue" : "rgb(255,255,255)"
            },
            {
              "colorName" : "orange",
              "colorValue" : "rgb(235,144,46)"
            },
            {
              "colorName" : "beige",
              "colorValue" : "rgb(255,198,138)"
            },
            {
              "colorName" : "green",
              "colorValue" : "rgb(108,166,36)"
            },
            {
              "colorName" : "blue",
              "colorValue" : "rgb(53,161,209)"
            },
            {
              "colorName" : "purple",
              "colorValue" : "rgb(198,77,175)"
            },
            {
              "colorName" : "pink",
              "colorValue" : "rgb(255,138,232)"
            },
            {
              "colorName" : "gray",
              "colorValue" : "rgb(163,163,163)"
            },
            {
              "colorName" : "black",
              "colorValue" : "rgb(47,47,47)"
            }
          ];

          this.availableLoiDashArrayObjects = [
            {
              "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black"/></svg>',
              "dashArrayValue" : ""
            },
            {
              "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20"/></svg>',
              "dashArrayValue" : "20"
            },
            {
              "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10"/></svg>',
              "dashArrayValue" : "20 10"
            },
            {
              "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10 5 10"/></svg>',
              "dashArrayValue" : "20"
            },
            {
              "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="5"/></svg>',
              "dashArrayValue" : "20"
            }
          ];

					this.kommonitorMapServiceInstance = kommonitorMapService;

          this.updateIntervalOptions = __env.updateIntervalOptions;
          this.indicatorTypeOptions = __env.indicatorTypeOptions;
          this.indicatorUnitOptions = __env.indicatorUnitOptions.sort();
          this.indicatorCreationTypeOptions = __env.indicatorCreationTypeOptions;
          this.geodataSourceFormats = __env.geodataSourceFormats;

          this.anySideBarIsShown = false;

					this.isMeasureOfValueChecked = false;
					this.isBalanceChecked = false;
					this.indicatorAndMetadataAsBalance;
					this.tmpIndicatorGeoJSON = undefined;

          this.wmsUrlForSelectedIndicator = undefined;
          this.wfsUrlForSelectedIndicator = undefined;

					this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
          this.simplifyGeometriesParameterName = __env.simplifyGeometriesParameterName;
          this.simplifyGeometriesOptions = __env.simplifyGeometriesOptions;
          this.simplifyGeometries = __env.simplifyGeometries;

          this.wmsDatasets = __env.wmsDatasets;
          this.wfsDatasets = __env.wfsDatasets;
          this.fileDatasets = [];

          this.availableRoles = [];
          this.availableUsers = [];
					this.availableProcessScripts = [];
          this.isochroneLegend;

          this.useOutlierDetectionOnIndicator = true;

					this.setProcessScripts = function(scriptsArray){
						this.availableProcessScripts = scriptsArray;
					};

					this.availableSpatialUnits = [];

					this.selectedSpatialUnit;
					this.selectedDate;

					this.setSpatialUnits = function(spatialUnitsArray){
						this.availableSpatialUnits = spatialUnitsArray;
          };
          
          // REPORTING

          this.reportingIndicatorConfig = [];

					// GEORESOURCES

					this.availableGeoresources = [];

					this.selectedGeoresource;

					this.setGeoresources = function(georesourcesArray){
						this.availableGeoresources = georesourcesArray;
					};



					// INDICATORS
					this.clickedIndicatorFeatureNames = new Array();

					this.availableIndicators = [];

					this.selectedIndicator;
          // backup used when switching themes --< this might make selectedIndicator undefined due to filtering list of theme-matching indicators
          this.selectedIndicatorBackup;
					this.wmsUrlForSelectedIndicator;
					this.wfsUrlForSelectedIndicator;

					this.selectedIndicatorLegendURL;

          this.measureOfValue = 51;
          
          // updateInterval (from kommonitor data management api) = ['ARBITRARY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']
          this.updateInterval = new Map();
          this.updateInterval.set("ARBITRARY", "beliebig");
          this.updateInterval.set("YEARLY", "jährlich");
          this.updateInterval.set("HALF_YEARLY", "halbjährig");
          this.updateInterval.set("MONTHLY", "monatlich");
          this.updateInterval.set("QUARTERLY", "vierteljährlich");

					this.setIndicators = function(indicatorsArray){
						this.availableIndicators = indicatorsArray;
					};


					// TOPICS

					this.availableTopics = [];

					this.selectedTopic;

					this.setTopics = function(topicsArray){
						this.availableTopics = topicsArray;
          };

          this.getIndicatorMetadataById = function(indicatorId){
            for (const indicatorMetadata of this.availableIndicators) {
              if(indicatorMetadata.indicatorId === indicatorId){
                return indicatorMetadata;
              }
            }
          };

          this.getGeoresourceMetadataById = function(georesourceId){
            for (const georesourceMetadata of this.availableGeoresources) {
              if(georesourceMetadata.georesourceId === georesourceId){
                return georesourceMetadata;
              }
            }
          };

          this.getIndicatorAbbreviationFromIndicatorId = function(indicatorId){
            for (var indicatorMetadata of this.availableIndicators) {
              if (indicatorMetadata.indicatorId === indicatorId){
                return indicatorMetadata.abbreviation;
              }
            }
          };

          this.getTopicHierarchyForTopicId = function(topicReferenceId){
            // create an array respresenting the topic hierarchy
            // i.e. [mainTopic_firstTier, subTopic_secondTier, subTopic_thirdTier, ...]
            var topicHierarchyArray = [];

            for (var i = 0; i < this.availableTopics.length; i++) {

              var mainTopicCandidate = this.availableTopics[i];

              if(mainTopicCandidate.topicId === topicReferenceId){
                topicHierarchyArray.push(mainTopicCandidate);
                break;
              }

              else if(this.findIdInAnySubTopicHierarchy(topicReferenceId, mainTopicCandidate.subTopics)){
                topicHierarchyArray.push(mainTopicCandidate);
                topicHierarchyArray = this.addSubTopicHierarchy(topicHierarchyArray, topicReferenceId, mainTopicCandidate.subTopics);
              }
            }

            return topicHierarchyArray;
          };

          this.findIdInAnySubTopicHierarchy = function(topicReferenceId, subTopicsArray){
            for (let index = 0; index < subTopicsArray.length; index++) {
              const subTopicCandidate = subTopicsArray[index];

              if(subTopicCandidate.topicId === topicReferenceId){
                return true;
              }

              else if(this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics)){
                return true;
              }
            }

            return false;
          };

          this.addSubTopicHierarchy = function(topicHierarchyArray, topicReferenceId, subTopicsArray){
            for (let index = 0; index < subTopicsArray.length; index++) {
              const subTopicCandidate = subTopicsArray[index];

              if(subTopicCandidate.topicId === topicReferenceId){
                topicHierarchyArray.push(subTopicCandidate);
                break;
              }

              else if(this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics)){
                topicHierarchyArray.push(subTopicCandidate);
                topicHierarchyArray = this.addSubTopicHierarchy(topicHierarchyArray, topicReferenceId, subTopicCandidate.subTopics);
              }
            }

            return topicHierarchyArray;
          };

					// FILTER
					this.rangeFilterData;
					this.filteredIndicatorFeatureNames;

          this.syntaxHighlightJSON = function(json) {
      		    if (typeof json != 'string') {
      		         json = JSON.stringify(json, undefined, 2);
      		    }
      		    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      		    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      		        var cls = 'number';
      		        if (/^"/.test(match)) {
      		            if (/:$/.test(match)) {
      		                cls = 'key';
      		            } else {
      		                cls = 'string';
      		            }
      		        } else if (/true|false/.test(match)) {
      		            cls = 'boolean';
      		        } else if (/null/.test(match)) {
      		            cls = 'null';
      		        }
      		        return '<span class="' + cls + '">' + match + '</span>';
      		    });
      		};

          /*
          * FETCH INITIAL METADATA ABOUT EACH RESOURCE
          */

          var fetchedTopicsInitially = false;
          var fetchedSpatialUnitsInitially = false;
          var fetchedGeoresourcesInitially = false;
          var fetchedIndicatorsInitially = false;
          var fetchedUsersInitially = false;
          var fetchedRolesInitially = false;

          // $rootScope.$on("$locationChangeStart", function(event){
          //   self.fetchAllMetadata();
          //   self.adminIsLoggedIn = false;
          // });

          this.fetchAllMetadata = function(){
            console.log("fetching all metadata from management component");

            var topicsPromise = this.fetchTopicsMetadata();
            var usersPromise = this.fetchUsersMetadata();
            var rolesPromise = this.fetchRolesMetadata();
            var spatialUnitsPromise = this.fetchSpatialUnitsMetadata();
            var georesourcesPromise = this.fetchGeoresourcesMetadata();
            var indicatorsPromise = this.fetchIndicatorsMetadata();
            var scriptsPromise = this.fetchIndicatorScriptsMetadata();

            var metadataPromises = [topicsPromise, usersPromise, rolesPromise, spatialUnitsPromise, georesourcesPromise, indicatorsPromise, scriptsPromise];

            $q.all(metadataPromises).then(function successCallback(successArray) {
                  console.log("Metadata fetched. Call initialize event.");
      						onMetadataLoadingCompleted();
      				}, function errorCallback(errorArray) {
                // todo error handling

      			});

          };

          var onMetadataLoadingCompleted = function(){
            
            setTimeout(() => {
              $rootScope.$broadcast("initialMetadataLoadingCompleted");

                  $timeout(function () {
                    $("option").each(function (index, element) {
                      var text = $(element).text();
                      $(element).attr("title", text);
                    });
              }, 1000);
            }, 1000);

              

          };

          this.fetchRolesMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + "/roles",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.availableRoles = response.data;
                fetchedRolesInitially = true;

              }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.error = response.statusText;
            });
          };

          this.fetchUsersMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + "/users",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.availableUsers=response.data;
                fetchedUsersInitially = true;

              }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.error = response.statusText;
            });
          };

          this.fetchTopicsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + "/topics",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setTopics(response.data);
                fetchedTopicsInitially = true;

              }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.error = response.statusText;
            });
          };

          this.fetchSpatialUnitsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + "/spatial-units",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setSpatialUnits(response.data);
                fetchedSpatialUnitsInitially = true;

              }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.error = response.statusText;
            });
          };

          this.fetchGeoresourcesMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + "/georesources",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setGeoresources(response.data);
                fetchedGeoresourcesInitially = true;

              }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.error = response.statusText;
            });
          };

          this.fetchIndicatorsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + "/indicators",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setIndicators(response.data);
                fetchedIndicatorsInitially = true;

              }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.error = response.statusText;
            });
          };

          this.fetchIndicatorScriptsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + "/process-scripts",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setProcessScripts(response.data);

              }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.error = response.statusText;
            });
          };

					this.indicatorValueIsNoData = function(indicatorValue){
						if(Number.isNaN(indicatorValue) || indicatorValue === null || indicatorValue === undefined){
							return true;
						}
						return false;
					}

					this.getIndicatorValueFromArray_asNumber = function(propertiesArray, targetDateString){
						if(!targetDateString.includes(DATE_PREFIX)){
							targetDateString = DATE_PREFIX + targetDateString;
						}
						var indicatorValue = propertiesArray[targetDateString];
						var value;
						if(this.indicatorValueIsNoData(indicatorValue)){
							value = "NoData";
						}
						else{
							value = +Number(indicatorValue).toFixed(numberOfDecimals);
						}

						return value;
					}

					this.getIndicatorValueFromArray_asFormattedText = function(propertiesArray, targetDateString){
						if(!targetDateString.includes(DATE_PREFIX)){
							targetDateString = DATE_PREFIX + targetDateString;
						}
						var indicatorValue = propertiesArray[targetDateString];
						var value;
						if(this.indicatorValueIsNoData(indicatorValue)){
							value = "NoData";
						}
						else{
						 	value = Number(indicatorValue).toLocaleString('de-DE', {maximumFractionDigits: numberOfDecimals});
						}

						return value;
					}

					this.getIndicatorValue_asNumber = function(indicatorValue){
						var value;
						if(this.indicatorValueIsNoData(indicatorValue)){
							value = "NoData";
						}
						else{
							value = +Number(indicatorValue).toFixed(numberOfDecimals);
						}

						return value;
					};

					this.getIndicatorValue_asFormattedText = function(indicatorValue){
						var value;
						if(this.indicatorValueIsNoData(indicatorValue)){
							value = "NoData";
						}
						else{
						 	value = Number(indicatorValue).toLocaleString('de-DE', {maximumFractionDigits: numberOfDecimals});
						}

						return value;
          };
          
          this.getTopicHierarchyDisplayString = function(topicReferenceId){
            var topicHierarchyArray = this.getTopicHierarchyForTopicId(topicReferenceId);
           
            var topicsString = "";
            for (let index = 0; index < topicHierarchyArray.length; index++) {
              if (index === 0) {
                // mainTopic --> first tier
                topicsString += topicHierarchyArray[index].topicName;
              }
              else {
                var numberOfWhitespaces = 2 * index;
                var whitespaceString = "";
                for (let k = 0; k < numberOfWhitespaces; k++) {
                  whitespaceString += " ";
                }
                topicsString += whitespaceString + topicHierarchyArray[index].topicName;
              }
  
              if (index < topicHierarchyArray.length - 1) {
                topicsString += "\n";
              }
  
            }

            return topicsString;
          };

          this.getIndicatorStringFromIndicatorType = function (indicatorType) {
            var indicatorTypeString;

            for (const indicatorTypeOption of this.indicatorTypeOptions) {
              if (indicatorType.includes(indicatorTypeOption.apiName)) {
                indicatorTypeString = indicatorTypeOption.displayName;
                break;
              }
            }

            return indicatorTypeString;
          };

          this.getColorForFeature = function(feature, indicatorMetadataAndGeoJSON, targetDate, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue){
            var color;

            if(!targetDate.includes(DATE_PREFIX)){
							targetDate = DATE_PREFIX + targetDate;
						}

            if(this.indicatorValueIsNoData(feature.properties[targetDate])){
              color = defaultColorForNoDataValues;
            }
            else if(this.filteredIndicatorFeatureNames.includes(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME])){
              color = defaultColorForFilteredValues;
            }
            else if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) === 0 ){
              color = defaultColorForZeroValues;
            }
            else if(feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("low") && this.useOutlierDetectionOnIndicator){
              color = defaultColorForOutliers_low;
            }
            else if(feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("high") && this.useOutlierDetectionOnIndicator){
              color = defaultColorForOutliers_high;
            }
            else if(isMeasureOfValueChecked){

              if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) >= +Number(measureOfValue).toFixed(numberOfDecimals)){

                for (var index=0; index < gtMeasureOfValueBrew.breaks.length; index++){

                  if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) == +Number(gtMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
                    if(index < gtMeasureOfValueBrew.breaks.length -1){
                      // min value
                      color =  gtMeasureOfValueBrew.colors[index];
                      break;
                    }
                    else {
                      //max value
                      if (gtMeasureOfValueBrew.colors[index]){
                        color =  gtMeasureOfValueBrew.colors[index];
                      }
                      else{
                        color =  gtMeasureOfValueBrew.colors[index - 1];
                      }
                      break;
                    }
                  }
                  else{
                    if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) < +Number(gtMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                      color =  gtMeasureOfValueBrew.colors[index];
                      break;
                    }
                  }
                }
              }
              else {

                // invert colors, so that lowest values will become strong colored!
                for (var index=0; index < ltMeasureOfValueBrew.breaks.length; index++){
                  if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) == +Number(ltMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
                    if(index < ltMeasureOfValueBrew.breaks.length -1){
                      // min value
                      color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index - 1];
                      break;
                    }
                    else {
                      //max value
                      if (ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index]){
                        color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index];
                      }
                      else{
                        color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index - 1];
                      }
                      break;
                    }
                  }
                  else{
                    if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) < +Number(ltMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                      color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index - 1];
                      break;
                    }
                  }
                }

              }

            }
            else{
              if(indicatorMetadataAndGeoJSON.indicatorType.includes('DYNAMIC')){

                if(feature.properties[targetDate] < 0){
                  
                  for (var index=0; index < dynamicDecreaseBrew.breaks.length; index++){
                    if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) == +Number(dynamicDecreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
                      if(index < dynamicDecreaseBrew.breaks.length -1){
                        // min value
                        color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
                        break;
                      }
                      else {
                        //max value
                        if (dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index]){
                          color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index];
                        }
                        else{
                          color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
                        }
                        break;
                      }
                    }
                    else{
                      if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) < +Number(dynamicDecreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                        color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
                        break;
                      }
                    }
                  }
                }
                else{
                  for (var index=0; index < dynamicIncreaseBrew.breaks.length; index++){
                    if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) == +Number(dynamicIncreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
                      if(index < dynamicIncreaseBrew.breaks.length -1){
                        // min value
                        color =  dynamicIncreaseBrew.colors[index];
                        break;
                      }
                      else {
                        //max value
                        if (dynamicIncreaseBrew.colors[index]){
                          color =  dynamicIncreaseBrew.colors[index];
                        }
                        else{
                          color =  dynamicIncreaseBrew.colors[index - 1];
                        }
                        break;
                      }
                    }
                    else{
                      if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) < +Number(dynamicIncreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                        color =  dynamicIncreaseBrew.colors[index];
                        break;
                      }
                    }
                  }
                }

              }
              else{

                if(containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, targetDate)){
                  if(this.getIndicatorValue_asNumber(feature.properties[targetDate]) >= 0){
                    if(feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0"){
                      color = defaultColorForZeroValues;
                      if(useTransparencyOnIndicator){
                        fillOpacity = defaultFillOpacityForZeroFeatures;
                      }
                    }
                    else{
                      for (var index=0; index < dynamicIncreaseBrew.breaks.length; index++){
                        if(this.getIndicatorValue_asNumber(feature.properties[targetDate]) == this.getIndicatorValue_asNumber(dynamicIncreaseBrew.breaks[index])){
                          if(index < dynamicIncreaseBrew.breaks.length -1){
                            // min value
                            color =  dynamicIncreaseBrew.colors[index];
                            break;
                          }
                          else {
                            //max value
                            if (dynamicIncreaseBrew.colors[index]){
                              color =  dynamicIncreaseBrew.colors[index];
                            }
                            else{
                              color =  dynamicIncreaseBrew.colors[index - 1];
                            }
                            break;
                          }
                        }
                        else{
                          if(this.getIndicatorValue_asNumber(feature.properties[targetDate]) < this.getIndicatorValue_asNumber(dynamicIncreaseBrew.breaks[index + 1])) {
                            color =  dynamicIncreaseBrew.colors[index];
                            break;
                          }
                        }
                      }
                    }
                  }
                  else{
                    if(feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0"){
                      color = defaultColorForZeroValues;
                      if(useTransparencyOnIndicator){
                        fillOpacity = defaultFillOpacityForZeroFeatures;
                      }
                    }
                    else{
                      // invert colors, so that lowest values will become strong colored!
                      for (var index=0; index < dynamicDecreaseBrew.breaks.length; index++){
                        if(this.getIndicatorValue_asNumber(feature.properties[targetDate]) == this.getIndicatorValue_asNumber(dynamicDecreaseBrew.breaks[index])){
                          if(index < dynamicDecreaseBrew.breaks.length -1){
                            // min value
                            color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
                            break;
                          }
                          else {
                            //max value
                            if (dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index]){
                              color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index];
                            }
                            else{
                              color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
                            }
                            break;
                          }
                        }
                        else{
                          if(this.getIndicatorValue_asNumber(feature.properties[targetDate]) < this.getIndicatorValue_asNumber(dynamicDecreaseBrew.breaks[index + 1])) {
                            color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
                            break;
                          }
                        }
                      }
                    }
                  }
                }
                else{
                  color = defaultBrew.getColorInRange(this.getIndicatorValue_asNumber(feature.properties[targetDate]));
                }
              }
            }

            return color;
          };

          var containsNegativeValues = function(geoJSON, propertyName){

            var containsNegativeValues = false;
            for(var i=0; i< geoJSON.features.length; i++){
              if (geoJSON.features[i].properties[propertyName] < 0){
                containsNegativeValues = true;
                break;
              }
            }

            return containsNegativeValues;
          };

          this.formatIndiatorNameForLabel = function(indicatorName, maxCharsPerLine){
            var separationSigns = [" ", "-", "_"];
            var counter = 0;
            var nextWord = "";
            var nextChar;
            var label = "";
            for(var i=0; i<indicatorName.length; i++){
              nextChar = indicatorName.charAt(i);
              nextWord += nextChar;
              if(counter === maxCharsPerLine){
                label += "\n";
                counter = 0;
              }
              else if(separationSigns.includes(nextChar)){
                // add word to label
                label += nextWord;
                nextWord = "";
              }
              counter++;
            }
            //append last word
            label += nextWord;
            return label;
          }

          this.filterIndicators = function (){
            return function( item ) {

              // var arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Prozentuale Ver"];
              var arrayOfNameSubstringsForHidingIndicators = __env.arrayOfNameSubstringsForHidingIndicators;

              // this is an item from i.e. indicatorRadar, that has a different structure
              if(item.indicatorMetadata){
                if(item.indicatorMetadata.applicableDates == undefined || item.indicatorMetadata.applicableDates.length === 0)
                  return false;

                  var isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(substring => String(item.indicatorMetadata.indicatorName).includes(substring));

                  if(isIndicatorThatShallNotBeDisplayed){
                    return false;
                  }
                return true;
              }
              else{
                //
                if(item.applicableDates == undefined || item.applicableDates.length === 0)
                  return false;

                  // var isIndicatorThatShallNotBeDisplayed = item.indicatorName.includes("Standardabweichung") || item.indicatorName.includes("Prozentuale Ver");
                  var isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(substring => String(item.indicatorName).includes(substring));

                  if(isIndicatorThatShallNotBeDisplayed){
                    return false;
                  }
                return true;
              }
            };
          };

          this.filterGeoresourcesByPoi = function(){
            return function( item ) {

              try{
                if(item.isPOI){
                  return true;
                }
                return false;
              }
              catch(error){
                return false;
              }
            };
          };

          this.filterPois = function(){
            return function( item ) {

              try{
                // if(item.datasetName.includes("Lebensmittel")){
                //   return false;
                // }
                return true;
              }
              catch(error){
                return true;
              }
            };
          };

          /**
           * creates and returns a pdf for the indicator given as parameter
           */
          this.createMetadataPDF = function(indicator) {

            var jspdf = new jsPDF();
            jspdf.setFontSize(16);
            // jspdf.text("Metadatenblatt", 70, 6);
  
            //insert logo
            var img = new Image();
            img.src = '/logos/KM_Logo1.png';
            jspdf.addImage(img, 'PNG', 193, 5, 12, 12);
  
            jspdf.setFontSize(16);
            jspdf.setFontStyle('bolditalic');
            var titleArray = jspdf.splitTextToSize(indicator.indicatorName, 180);
            jspdf.text(titleArray, 14, 25);
  
            if (indicator.characteristicValue && indicator.characteristicValue != "-" && indicator.characteristicValue != "") {
              jspdf.setFontSize(14);
              jspdf.text(indicator.characteristicValue, 14, 25);
            }
  
  
            jspdf.setFontSize(11);
  
            var initialStartY = 30;
  
            if (titleArray.length > 1) {
              titleArray.forEach(function (item) {
                initialStartY += 5;
              });
            }
            if (indicator.characteristicValue && indicator.characteristicValue != "-" && indicator.characteristicValue != "") {
              initialStartY += 5;
            }
  
            var headStyles = {
              fontStyle: 'bold',
              fontSize: 12,
              fillColor: '#337ab7',
              // auto or wrap
              cellWidth: 'auto'
            };
  
            var bodyStyles = {
              fontStyle: 'normal',
              fontSize: 11,
              // auto or wrap or number
              cellWidth: 'auto'
            };
  
            // first column with fixed width
            var columnStyles = {
              0: { cellWidth: 45, fontStyle: 'bold' },
              1: { fontStyle: 'normal' }
            };
  
            var topicsString = "";
  
            var topicReferenceId = indicator.topicReference;
  
            // will be an array representing the topic hierarchy
            // i.e. [mainTopic, subTopicFirstTier, subTopicSecondTier, ...]
            var topicHierarchyArray = this.getTopicHierarchyForTopicId(topicReferenceId);
  
            for (let index = 0; index < topicHierarchyArray.length; index++) {
              if (index === 0) {
                // mainTopic --> first tier
                topicsString += topicHierarchyArray[index].topicName;
              }
              else {
                var numberOfWhitespaces = 2 * index;
                var whitespaceString = "";
                for (let k = 0; k < numberOfWhitespaces; k++) {
                  whitespaceString += " ";
                }
                topicsString += whitespaceString + topicHierarchyArray[index].topicName;
              }
  
              if (index < topicHierarchyArray.length - 1) {
                topicsString += "\n";
              }
  
            }
  
            var category = "Subindikator";
            if (indicator.isHeadingIndicator) {
              category = "Leitindikator";
            }
  
            // Or JavaScript:
            jspdf.autoTable({
              head: [['Themenfeld', 'Kategorie', 'Typ', 'Kennzeichen']],
              body: [
                [topicsString, category, this.getIndicatorStringFromIndicatorType(indicator), indicator.abbreviation ? indicator.abbreviation : "-"]
                // ...
              ],
              theme: 'grid',
              headStyles: headStyles,
              bodyStyles: bodyStyles,
              startY: initialStartY
            });
  
            var linkedIndicatorsString = "";
  
            for (var [index, linkedIndicator] of indicator.referencedIndicators.entries()) {
              linkedIndicatorsString += linkedIndicator.referencedIndicatorName + " - \n   " + linkedIndicator.referencedIndicatorDescription;
  
              if (index < indicator.referencedIndicators.length - 1) {
                linkedIndicatorsString += "\n\n";
              }
            }
  
            if (linkedIndicatorsString === "") {
              linkedIndicatorsString = "-";
            }
  
            var linkedGeoresourcesString = "";
  
            for (var [k, linkedGeoresource] of indicator.referencedGeoresources.entries()) {
              linkedGeoresourcesString += linkedGeoresource.referencedGeoresourceName + " - \n   " + linkedGeoresource.referencedGeoresourceDescription;
  
              if (k < indicator.referencedGeoresources.length - 1) {
                linkedGeoresourcesString += "\n\n";
              }
            }
  
            if (linkedGeoresourcesString === "") {
              linkedGeoresourcesString = "-";
            }
  
            // jspdf.autoTable({
            //     head: [],
            //     body: [
            //         ["Beschreibung", indicator.metadata.description],
            //         ["Maßeinheit", indicator.unit],
            //         ["Definition des Leitindikators", "-"],
            //         ["Klassifizierung", "-"],
            //         ["Interpretation", "-"],
            //         ["Verknüpfte Indikatoren", linkedIndicatorsString],
            //         ["Verknüpfte Geodaten", linkedGeoresourcesString]
            //         // ...
            //     ],
            //     startY: jspdf.autoTable.previous.finalY + 20,
            // });
  
            var spatialUnitsString = "";
            var processedSpatialUnits = 0;
  
            for (var availableSpatialUnit of this.availableSpatialUnits) {
  
              for (var applicableSpatialUnit of indicator.applicableSpatialUnits) {
  
                if (availableSpatialUnit.spatialUnitLevel === applicableSpatialUnit) {
                  spatialUnitsString += applicableSpatialUnit;
                  processedSpatialUnits++;
  
                  if (processedSpatialUnits < indicator.applicableSpatialUnits.length) {
                    spatialUnitsString += "\n";
                  }
                }
  
              }
            }
  
            var datesString = "";
  
            for (var [j, date] of indicator.applicableDates.entries()) {
  
              var dateComponents = date.split("-");
              var asDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));
  
              datesString += this.tsToDate_fullYear(this.dateToTS(asDate));
  
              if (j < indicator.applicableDates.length - 1) {
                datesString += "\n";
              }
            }
  
            jspdf.autoTable({
              head: [],
              body: [
                ["Beschreibung", indicator.metadata.description],
                ["Maßeinheit", indicator.unit],
                ["Methodik", indicator.processDescription ? indicator.processDescription : "-"],
                // ["Klassifizierung", "-"],
                ["Interpretation", indicator.interpretation ? indicator.interpretation : "-"],
                ["Tags", indicator.tags ? JSON.stringify(indicator.tags) : "-"],
                ["Verknüpfte Indikatoren", linkedIndicatorsString],
                ["Verknüpfte Geodaten", linkedGeoresourcesString]
              ],
              theme: 'grid',
              headStyles: headStyles,
              bodyStyles: bodyStyles,
              columnStyles: columnStyles,
              startY: jspdf.autoTable.previous.finalY + 10
            });
  
            // // linked elements
            // jspdf.autoTable({
            //     head: [],
            //     body: [
            //         ["Verknüpfte Indikatoren", linkedIndicatorsString],
            //         ["Verknüpfte Geodaten", linkedGeoresourcesString]
            //     ],
            //     theme: 'grid',
            //     headStyles: headStyles,
            //     bodyStyles: bodyStyles,
            //     columnStyles: columnStyles,
            //     startY: jspdf.autoTable.previous.finalY + 10
            // });
  
            // linked elements
            jspdf.autoTable({
              head: [],
              body: [
                ["Datengrundlage", indicator.metadata.databasis ? indicator.metadata.databasis : "-"],
                ["Datenquelle", indicator.metadata.datasource ? indicator.metadata.datasource : "-"],
                ["Datenhalter und Kontakt", indicator.metadata.contact ? indicator.metadata.contact : "-"],
                ["Bemerkung", indicator.metadata.note ? indicator.metadata.note : "-"],
                ["Raumbezug", spatialUnitsString],
                // $scope.updateInteval is a map mapping the english KEYs to german expressions
                ["Zeitbezug / Fortführungsintervall", this.updateInterval.get(indicator.metadata.updateInterval.toUpperCase())],
                ["Verfügbare Zeitreihen", datesString],
                ["Datum der letzten Aktualisierung", indicator.metadata.lastUpdate],
                ["Quellen / Literatur", indicator.metadata.literature ? indicator.metadata.literature : "-"]
              ],
              theme: 'grid',
              headStyles: headStyles,
              bodyStyles: bodyStyles,
              columnStyles: columnStyles,
              startY: jspdf.autoTable.previous.finalY + 10
            });
  
            //
            // jspdf.autoTable({
            //     head: [],
            //     body: [
            //         ["Quellen / Literatur", indicator.metadata.literature ? indicator.metadata.literature : "-"]
            //         // ...
            //     ],
            //     theme: 'grid',
            //     headStyles: headStyles,
            //     bodyStyles: bodyStyles,
            //     columnStyles: columnStyles,
            //     startY: jspdf.autoTable.previous.finalY + 10
            // });
  
            var pdfName = indicator.indicatorName + ".pdf";
  
            jspdf.setProperties({
              title: 'KomMonitor Indikatorenblatt',
              subject: pdfName,
              author: 'KomMonitor',
              keywords: 'Indikator, Metadatenblatt',
              creator: 'KomMonitor'
            });
            
            return jspdf
          }

          this.getIndicatorStringFromIndicatorType = function (indicator) {
            var indicatorTypeString;
            if (indicator.indicatorType.includes("DYNAMIC_ABSOLUTE")) {
              indicatorTypeString = "Dynamik-Indikator (absolute)";
            }
            else if (indicator.indicatorType.includes("DYNAMIC_RELATIVE")) {
              indicatorTypeString = "Dynamik-Indikator (relativ)";
            }
            else if (indicator.indicatorType.includes("DYNAMIC_STANDARDIZED")) {
              indicatorTypeString = "Dynamik-Indikator (standardisiert)";
            }
            else if (indicator.indicatorType.includes("STATUS_ABSOLUTE")) {
              indicatorTypeString = "Status-Indikator (absolut)";
            }
            else if (indicator.indicatorType.includes("STATUS_RELATIVE")) {
              indicatorTypeString = "Status-Indikator (relativ)";
            }
            else if (indicator.indicatorType.includes("STATUS_STANDARDIZED")) {
              indicatorTypeString = "Status-Indikator (standardisiert)";
            }
  
            return indicatorTypeString;
          };

          this.dateToTS = function(date) {
            return date.valueOf();
          }
  
          this.tsToDate = function(ts) {
            var date = new Date(ts);
  
            return date.toLocaleDateString("de-DE", {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
  
          this.tsToDate_fullYear = function(ts) {
            var date = new Date(ts);
  
            /**
            * TODO FIXME dateSLider formatter will return only year for now to prevent misleading month and day settings
            */
  
            return date.getFullYear();
  
            // return date.toLocaleDateString("de-DE", {
            // 		year: 'numeric',
            // 		month: 'long',
            // 		day: 'numeric'
            // });
          }

				}]);
