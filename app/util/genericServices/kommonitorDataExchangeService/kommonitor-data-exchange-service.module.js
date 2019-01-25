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

					this.kommonitorMapServiceInstance = kommonitorMapService;

					this.isMeasureOfValueChecked = false;
					this.tmpIndicatorGeoJSON = undefined;

					this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;

					this.availableProcessScripts;

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

				}]);
