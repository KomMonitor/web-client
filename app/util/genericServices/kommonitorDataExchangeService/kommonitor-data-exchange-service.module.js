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
		.module('kommonitorDataExchange')
		.service(
				'kommonitorDataExchangeService', ['$rootScope', 'kommonitorMapService', '$http', '__env',
				function($rootScope,
						kommonitorMapService, $http, __env) {

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

					this.kommonitorMapServiceInstance = kommonitorMapService;

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

					this.availableProcessScripts;
          this.isochroneLegend;

          this.useOutlierDetectionOnIndicator = true;

					this.setProcessScripts = function(scriptsArray){
						this.availableProcessScripts = scriptsArray;
					};

					this.availableSpatialUnits;

					this.selectedSpatialUnit;
					this.selectedDate;

					this.setSpatialUnits = function(spatialUnitsArray){
						this.availableSpatialUnits = spatialUnitsArray;
					};

					// GEORESOURCES

					this.availableGeoresources;

					this.selectedGeoresource;

					this.setGeoresources = function(georesourcesArray){
						this.availableGeoresources = georesourcesArray;
					};



					// INDICATORS
					this.clickedIndicatorFeatureNames = new Array();

					this.availableIndicators;

					this.selectedIndicator;
          // backup used when switching themes --< this might make selectedIndicator undefined due to filtering list of theme-matching indicators
          this.selectedIndicatorBackup;
					this.wmsUrlForSelectedIndicator;
					this.wfsUrlForSelectedIndicator;

					this.selectedIndicatorLegendURL;

					this.measureOfValue = 51;

					// an array of only the properties and metadata of all indicatorFeatures
					this.allIndicatorPropertiesForCurrentSpatialUnitAndTime;

					this.setIndicators = function(indicatorsArray){
						this.availableIndicators = indicatorsArray;
					};


					// TOPICS

					this.availableTopics;

					this.selectedTopic;

					this.setTopics = function(topicsArray){
						this.availableTopics = topicsArray;
					};

					// FILTER
					this.rangeFilterData;
					this.filteredIndicatorFeatureNames;

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
					}

					this.getIndicatorValue_asFormattedText = function(indicatorValue){
						var value;
						if(this.indicatorValueIsNoData(indicatorValue)){
							value = "NoData";
						}
						else{
						 	value = Number(indicatorValue).toLocaleString('de-DE', {maximumFractionDigits: numberOfDecimals});
						}

						return value;
					}

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
                  color = defaultBrew.getColorInRange(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate));
              }
            }

            return color;
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

				}]);
