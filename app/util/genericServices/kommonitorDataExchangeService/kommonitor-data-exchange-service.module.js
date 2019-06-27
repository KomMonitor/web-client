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

					this.kommonitorMapServiceInstance = kommonitorMapService;

          this.anySideBarIsShown = false;

					this.isMeasureOfValueChecked = false;
					this.isBalanceChecked = false;
					this.indicatorAndMetadataAsBalance;
					this.tmpIndicatorGeoJSON = undefined;

					this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
          this.simplifyGeometriesParameterName = __env.simplifyGeometriesParameterName;
          this.simplifyGeometriesOptions = __env.simplifyGeometriesOptions;
          this.simplifyGeometries = __env.simplifyGeometries;

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

				}]);
