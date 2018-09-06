angular.module('wpsProperties', ['wpsExecuteInput', 'wpsExecuteOutput', 'wpsGeometricOutput', 'wpsMap']);

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
		.module('wpsProperties')
		.service(
				'wpsPropertiesService', ['$rootScope', 'wpsExecuteInputService', 'wpsExecuteOutputService',
				                         'wpsGeometricOutputService', 'wpsMapService', '$http',
				function($rootScope, wpsExecuteInputService, wpsExecuteOutputService, wpsGeometricOutputService,
						wpsMapService, $http) {

					this.wpsExecuteInputServiceInstance = wpsExecuteInputService;
					this.wpsExecuteOutputServiceInstance = wpsExecuteOutputService;
					this.wpsGeometricOutputServiceInstance = wpsGeometricOutputService;
					this.wpsMapServiceInstance = wpsMapService;

					this.baseUrlToKomMonitorDataAPI = "http://localhost:8085/rest/v1";

					this.availableProcessScripts;

					this.setProcessScripts = function(scriptsArray){
						this.availableProcessScripts = scriptsArray;
					};

					this.availableSpatialUnits;

					this.selectedSpatialUnit;

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

					this.availableIndicators;

					this.selectedIndicator;
					this.wmsUrlForSelectedIndicator;
					this.wfsUrlForSelectedIndicator;

					this.selectedIndicatorLegendURL;

					this.measureOfValue = 51;

					this.setIndicators = function(indicatorsArray){
						this.availableIndicators = indicatorsArray;
					};

					this.onChangeSelectedIndicator = function(){
						// parse the WMS and WFS URL from the selected indicator
						// for this we also have to inspect the currently seelcted spatial unit

						 // e.g. the structure of OGC services within indocator metadata looks like:
							// 		 "ogcServices": [
			        //     {
			        //         "spatialUnit": "Stadtteilebene",
			        //         "wmsUrl": "http://localhost:8080/geoserver/kommonitor/VIEW_INDICATOR_0/wms?service=WMS&request=GetCapabilities",
			        //         "wfsUrl": "http://localhost:8080/geoserver/kommonitor/VIEW_INDICATOR_0/wfs?service=WFS&request=GetCapabilities"
			        //     }
			        // ]

							this.wmsUrlForSelectedIndicator = undefined;
							this.wmsUrlForSelectedIndicator = undefined;

							var selectedSpatialUnitName = this.selectedSpatialUnit.spatialUnitLevel;

							this.selectedIndicator.ogcServices.forEach(function(ogcServiceEntry){
								if (ogcServiceEntry.spatialUnit === selectedSpatialUnitName){
									this.wmsUrlForSelectedIndicator = ogcServiceEntry.wmsUrl;
									this.wfsUrlForSelectedIndicator = ogcServiceEntry.wfsUrl;

									// $scope.$apply();
									$rootScope.$broadcast("updateIndicatorOgcServices", this.wmsUrlForSelectedIndicator, this.wfsUrlForSelectedIndicator);
									return;
								}
							});
					}



					// TOPICS

					this.availableTopics;

					this.selectedTopic;

					this.setTopics = function(topicsArray){
						this.availableTopics = topicsArray;
					};



					// this.availableBaseData = [
					// {"name":"Baublöcke",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/Baubloecke_EWS/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/Baubloecke_EWS/wms",
					//  "layerName":"kommonitor:Baubloecke_EWS"},
					// {"name":"Flächennutzungskartierung",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/FNK15/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/FNK15/wms",
					//  "layerName":"kommonitor:FNK15"},
					//  {"name":"Freiflächen - 2009",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/fnk_frfl_2009/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/fnk_frfl_2009/wms",
					//  "layerName":"kommonitor:fnk_frfl_2009"},
					//  {"name":"Freiflächen - 2012",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/fnk_frfl_2012/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/fnk_frfl_2012/wms",
					//  "layerName":"kommonitor:fnk_frfl_2012"},
					//  {"name":"Freiflächen - 2015",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/fnk_frfl_2015/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/fnk_frfl_2015/wms",
					//  "layerName":"kommonitor:fnk_frfl_2015"}];
					//
					// this.selectedBaseData;
					//
					// this.availableIndicators = [
					// {"name":"Fussl. Erreichbarkeit von Freiraum - Baublockebene - 2015",
					// "jahr":"2015",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wms",
					//  "styleNameSLD":"frfl_versorgung_baublockebene_2015_style",
					//  "measureOfValueText": "Angabe des Trennwertes versorgter und nicht versorgter Entitäten in Prozent (0 - 100). Default: 51%",
					//  "layerName":"kommonitor:frfl_versorgung_baublockebene",
					//  "layerLegendText":"Der Indikator zeigt die Versorgung der Einwohner mit fussl. erreichbarem Freiraum auf der Baublockebene. Als default-Wertmaßstab zur Unterscheidung versorgter und nicht versorgter Entitäten wurde 51% der versorgten Fläche genutzt.",
					//  "layerLegendURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=kommonitor:frfl_versorgung_baublockebene"},
					//
					//  {"name":"Fussl. Erreichbarkeit von Freiraum - Baublockebene - 2012",
					//  "jahr":"2012",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wms",
					//  "styleNameSLD":"frfl_versorgung_baublockebene_2012_style",
					//  "measureOfValueText": "Angabe des Trennwertes versorgter und nicht versorgter Entitäten in Prozent (0 - 100). Default: 51%",
					//  "layerName":"kommonitor:frfl_versorgung_baublockebene",
					//  "layerLegendText":"Der Indikator zeigt die Versorgung der Einwohner mit fussl. erreichbarem Freiraum auf der Baublockebene. Als default-Wertmaßstab zur Unterscheidung versorgter und nicht versorgter Entitäten wurde 51% der versorgten Fläche genutzt.",
					//  "layerLegendURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=kommonitor:frfl_versorgung_baublockebene"},
					//
					//  {"name":"Fussl. Erreichbarkeit von Freiraum - Baublockebene - 2009",
					//  "jahr":"2009",
					//  "wfsURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wfs",
					//  "wmsURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wms",
					//  "styleNameSLD":"frfl_versorgung_baublockebene_2009_style",
					//  "measureOfValueText": "Angabe des Trennwertes versorgter und nicht versorgter Entitäten in Prozent (0 - 100). Default: 51%",
					//  "layerName":"kommonitor:frfl_versorgung_baublockebene",
					//  "layerLegendText":"Der Indikator zeigt die Versorgung der Einwohner mit fussl. erreichbarem Freiraum auf der Baublockebene. Als default-Wertmaßstab zur Unterscheidung versorgter und nicht versorgter Entitäten wurde 51% der versorgten Fläche genutzt.",
					//  "layerLegendURL":"http://localhost:8080/geoserver/kommonitor/frfl_versorgung_baublockebene/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=kommonitor:frfl_versorgung_baublockebene"}
					// ];




				}]);
