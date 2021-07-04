angular.module('kommonitorDataExchange', ['kommonitorMap', 'kommonitorKeycloakHelper']);

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
		.module('kommonitorDataExchange', [])
		.service(
				'kommonitorDataExchangeService', ['$rootScope', '$timeout', 'kommonitorMapService', 'kommonitorKeycloakHelperService', 
        '$http', '__env', '$q', 'Auth',
				function($rootScope, $timeout,
						kommonitorMapService, kommonitorKeycloakHelperService, $http, __env, $q, Auth,) {              

              let thisService = this;
              this.appTitle = __env.appTitle;

              this.customLogoURL = __env.customLogoURL;
              this.customLogo_onClickURL = __env.customLogo_onClickURL;
              this.customLogoWidth = __env.customLogoWidth; 
              this.customGreetingsContact_name = __env.customGreetingsContact_name;
              this.customGreetingsContact_organisation = __env.customGreetingsContact_organisation;
              this.customGreetingsContact_mail = __env.customGreetingsContact_mail;
              this.customGreetingsTextInfoMessage = __env.customGreetingsTextInfoMessage; // maybe undefined or empty string

              this.showDiagramExportButtons = true;
              this.showGeoresourceExportButtons = true;

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

              const georesourcesPublicEndpoint = "/public/georesources";
              const georesourcesProtectedEndpoint = "/georesources";
              const spatialUnitsPublicEndpoint = "/public/spatial-units";
              const spatialUnitsProtectedEndpoint = "/spatial-units";
              const indicatorsPublicEndpoint = "/public/indicators";
              const indicatorsProtectedEndpoint = "/indicators";
              const scriptsPublicEndpoint = "/public/process-scripts";
              const scriptsProtectedEndpoint = "/process-scripts";
              const topicsPublicEndpoint = "/public/topics";
              // only resource that has no public endpoint
              const rolesEndpoint = "/roles";

              var georesourcesEndpoint = georesourcesProtectedEndpoint;
              var spatialUnitsEndpoint = spatialUnitsProtectedEndpoint;
              var indicatorsEndpoint = indicatorsProtectedEndpoint;
              var scriptsEndpoint = scriptsProtectedEndpoint;
              this.spatialResourceGETUrlPath_forAuthentication = "/public";

          var self = this;

          this.headlineIndicatorHierarchy = [];
          this.computationIndicatorHierarchy = [];
          this.topicIndicatorHierarchy = [];
          this.topicIndicatorHierarchy_forOrderView = [];

          this.topicGeoresourceHierarchy = [];
          this.topicGeoresourceHierarchy_unmappedEntries = {};
          this.georesourceMapKey_forUnmappedTopicReferences = "unmapped";

          this.enableKeycloakSecurity = __env.enableKeycloakSecurity;
          this.currentKeycloakLoginRoles = [];
          this.currentKomMonitorLoginRoleNames = [];

          // MAP objects for available resource metadata in order to have quick access to datasets by ID
          this.availableIndicators_map = new Map();
          this.availableGeoresources_map = new Map();
          this.availableSpatialUnits_map = new Map();
          this.availableProcessScripts_map = new Map();
          this.availableRoles_map = new Map();

          this.setCurrentKomMonitorRoles = function(){
            var roleMetadataForCurrentKeycloakLoginRoles = this.availableRoles.filter(role => this.currentKeycloakLoginRoles.includes(role.roleName)); 

            var tmpCurrentKomMonitorRoles = [];

            for (const roleMetadata of roleMetadataForCurrentKeycloakLoginRoles) {              
              tmpCurrentKomMonitorRoles.push(roleMetadata.roleName);
            }
            this.currentKomMonitorLoginRoleNames = tmpCurrentKomMonitorRoles;
          };

          this.isAllowedSpatialUnitForCurrentIndicator = function(spatialUnitMetadata){
            if(! this.selectedIndicator){
              return false;
            }

            if(! spatialUnitMetadata || ! spatialUnitMetadata.spatialUnitLevel){
              return false;
            }

            var isAllowed = false;
            
            var roleMetadataForCurrentKeycloakLoginRoles = this.availableRoles.filter(role => this.currentKeycloakLoginRoles.includes(role.roleName));
            this.setCurrentKomMonitorRoles();                     
            
            var filteredApplicableUnits = this.selectedIndicator.applicableSpatialUnits.filter(function (applicableSpatialUnit) {
              if (applicableSpatialUnit.spatialUnitName ===  spatialUnitMetadata.spatialUnitLevel){
                if (applicableSpatialUnit.allowedRoles.length == 0){
                  return true;
                }
                else{
                  return applicableSpatialUnit.allowedRoles.some(allowedRoleId => roleMetadataForCurrentKeycloakLoginRoles.some(roleMetadata => roleMetadata.roleId === allowedRoleId) );
                }
              }              
              
            });

            return filteredApplicableUnits.length > 0;
          };

          this.FEATURE_ID_PROPERTY_NAME = __env.FEATURE_ID_PROPERTY_NAME;
          this.FEATURE_NAME_PROPERTY_NAME = __env.FEATURE_NAME_PROPERTY_NAME;
          this.VALID_START_DATE_PROPERTY_NAME = __env.VALID_START_DATE_PROPERTY_NAME;
          this.VALID_END_DATE_PROPERTY_NAME = __env.VALID_END_DATE_PROPERTY_NAME;
          this.indicatorDatePrefix = __env.indicatorDatePrefix;

          this.datePickerOptions = {
            autoclose: true,
      			language: 'de',
      			format: 'yyyy-mm-dd'
          };

          this.disableIndicatorDatePicker = false;

          this.getLimitedDatePickerOptions = function(availableDates){

            var months = new Map();

            var years = new Map();

            var yearMonths = new Map();

            for (const dateString of availableDates) {
              var date = new Date(dateString);
              var month = date.getMonth() + 1;
              var year = date.getFullYear();
              var yearMonth = year + "-" + month;  

              months.set(month, month);
              years.set(year, year);
              yearMonths.set(yearMonth, yearMonth);
            }

            var newDatePickerOptions = {
              autoclose: true,
              language: 'de',
              format: 'yyyy-mm-dd',              
              endDate: new Date(availableDates[availableDates.length - 1]),
              startDate: new Date(availableDates[0]),
              defaultViewDate: new Date(availableDates[availableDates.length - 1]),
              beforeShowDay: function(date) {
                var month = (date.getMonth()+1);
                if (month < 10 ){
                  month = "0" + month;
                }
                var day = (date.getDate());
                if (day < 10 ){
                  day = "0" + day;
                }
                var dateString = date.getFullYear() + "-" + month + "-" + day;
  
                if (availableDates.includes(dateString)) {
  
                  return "enabled-datepicker-item";
  
                } else {
  
                  return "disabled disabled-datepicker-item";
  
                }
              },
              beforeShowMonth: function(date) {
                var month = date.getMonth()+1;
                var year = date.getFullYear();
                var yearMonth = year + "-" + month;  
  
                if (yearMonths.has(yearMonth)) {
  
                  return "enabled-datepicker-item";
  
                } else {
  
                  return "disabled disabled-datepicker-item";
  
                }               
              },
              beforeShowYear: function(date) {
                var year = date.getFullYear();
  
                if (years.has(year)) {
  
                  return "enabled-datepicker-item";
  
                } else {
  
                  return "disabled disabled-datepicker-item";
  
                }
              },
              beforeShowDecade: function(date) {
                var year = date.getFullYear();
  
                if (years.has(year)) {
  
                  return "enabled-datepicker-item";
  
                } else {
  
                  return "disabled disabled-datepicker-item";
  
                }
              },
              beforeShowCentury: function(date) {
                var year = date.getFullYear();
  
                if (years.has(year)) {
  
                  return "enabled-datepicker-item";
  
                } else {
  
                  return "disabled disabled-datepicker-item";
  
                }
              }
            };

            return newDatePickerOptions;
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
              "dashArrayValue" : "20 10 5 10"
            },
            {
              "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="5"/></svg>',
              "dashArrayValue" : "5"
            }
          ];

          this.getLoiDashSvgFromStringValue = function(loiDashArrayString){
            for (const loiDashArrayObject of this.availableLoiDashArrayObjects) {
              if(loiDashArrayObject.dashArrayValue == loiDashArrayString){
                return loiDashArrayObject.svgString;
              }
            }
          };

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

          this.wmsDatasets = __env.wmsDatasets.sort((a, b) => (a.title > b.title) ? 1 : -1);
          this.wfsDatasets = __env.wfsDatasets.sort((a, b) => (a.title > b.title) ? 1 : -1);
          this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
          this.wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));


          this.fileDatasets = [];

          this.availableRoles = [];
          this.availableUsers = [];
					this.availableProcessScripts = [];
          this.isochroneLegend;

          this.useOutlierDetectionOnIndicator = __env.useOutlierDetectionOnIndicator;
          this.classifyZeroSeparately = __env.classifyZeroSeparately;
          this.classifyUsingWholeTimeseries = __env.classifyUsingWholeTimeseries;
          this.useNoDataToggle = __env.useNoDataToggle;

          this.getUpdateIntervalDisplayValue = function(apiValue){
            for (const updateIntervalOption of this.updateIntervalOptions) {
              if(updateIntervalOption.apiName === apiValue){
                return updateIntervalOption.displayName
              }
            }
          };

          this.getBaseUrlToKomMonitorDataAPI_spatialResource = function(){
            return this.baseUrlToKomMonitorDataAPI + this.spatialResourceGETUrlPath_forAuthentication;
          };

          this.checkAuthentication = function() {
            if (Auth.keycloak.authenticated) {
              georesourcesEndpoint = georesourcesProtectedEndpoint;
              spatialUnitsEndpoint = spatialUnitsProtectedEndpoint;
              indicatorsEndpoint = indicatorsProtectedEndpoint;
              scriptsEndpoint = scriptsProtectedEndpoint;
              this.spatialResourceGETUrlPath_forAuthentication = "";
            } else{
              georesourcesEndpoint = georesourcesPublicEndpoint;
              spatialUnitsEndpoint = spatialUnitsPublicEndpoint;
              indicatorsEndpoint = indicatorsPublicEndpoint;
              scriptsEndpoint = scriptsPublicEndpoint;
              this.spatialResourceGETUrlPath_forAuthentication = "/public";
            }

          };

          self.checkAuthentication();

					this.setProcessScripts = function(scriptsArray){
						this.availableProcessScripts = scriptsArray;
            this.availableProcessScripts_map = new Map();
            for (const scriptMetadata of scriptsArray) {
              this.availableProcessScripts_map.set(scriptMetadata.scriptId, scriptMetadata);
            }
          };

          this.addSingleProcessScriptMetadata = function(processScriptMetadata){
            let tmpArray = [processScriptMetadata];
            Array.prototype.push.apply(tmpArray, this.availableProcessScripts);
            this.availableProcessScripts =  tmpArray;
            this.availableProcessScripts_map.set(processScriptMetadata.scriptId, processScriptMetadata);
          };

          this.replaceSingleProcessScriptMetadata = function(processScriptMetadata){
            for (let index = 0; index < this.availableProcessScripts.length; index++) {
              let processScript = this.availableProcessScripts[index];
              if(processScript.scriptId == processScriptMetadata.scriptId){
                this.availableProcessScripts[index] = processScriptMetadata;
                break;
              }
            }
            this.availableProcessScripts_map.set(processScriptMetadata.scriptId, processScriptMetadata);
          };

          this.deleteSingleProcessScriptMetadata = function(processScriptId){
            for (let index = 0; index < this.availableProcessScripts.length; index++) {
              const processScript = this.availableProcessScripts[index];
              if(processScript.scriptId == processScriptId){
                this.availableProcessScripts.splice(index, 1);
                break;
              }              
            }
            this.availableProcessScripts_map.delete(processScriptId);
          };

          this.getProcessScriptMetadataById = function(scriptId){
            return this.availableProcessScripts_map.get(scriptId);
          };


          // ERROR HANDLING
          this.errorMessage = undefined;
          this.hideErrorAlert = function(){
            $(".mapApplicationErrorAlert").hide();
          };

          this.displayMapApplicationError = function(error){
            $timeout(function () {
                if(error.data){							
                  self.errorMessage = self.syntaxHighlightJSON(error.data);
                }
                else{
                  self.errorMessage = self.syntaxHighlightJSON(error);
                }
    
                // $rootScope.$apply();
                $rootScope.$broadcast("hideLoadingIconOnMap");
    
                $(".mapApplicationErrorAlert").show();
              }, 1000);

          };
          
          // SPATIAL UNITS

					this.availableSpatialUnits = [];

					this.selectedSpatialUnit;
					this.selectedDate;

					this.setSpatialUnits = function(spatialUnitsArray){
						this.availableSpatialUnits = spatialUnitsArray;
            this.availableSpatialUnits_map = new Map();
            for (const spatialUnitMetadata of spatialUnitsArray) {
              this.availableSpatialUnits_map.set(spatialUnitMetadata.spatialUnitId, spatialUnitMetadata);
            }
          };

          this.addSingleSpatialUnitMetadata = function(spatialUnitMetadata){
            let tmpArray = [spatialUnitMetadata];
            Array.prototype.push.apply(tmpArray, this.availableSpatialUnits);
            this.availableSpatialUnits =  tmpArray;
            this.availableSpatialUnits_map.set(spatialUnitMetadata.spatialUnitId, spatialUnitMetadata);
          };

          this.replaceSingleSpatialUnitMetadata = function(spatialUnitMetadata){
            for (let index = 0; index < this.availableSpatialUnits.length; index++) {
              let spatialUnit = this.availableSpatialUnits[index];
              if(spatialUnit.spatialUnitId == spatialUnitMetadata.spatialUnitId){
                this.availableSpatialUnits[index] = spatialUnitMetadata;
                break;
              }
            }
            this.availableSpatialUnits_map.set(spatialUnitMetadata.spatialUnitId, spatialUnitMetadata);
          };

          this.deleteSingleSpatialUnitMetadata = function(spatialUnitId){
            for (let index = 0; index < this.availableSpatialUnits.length; index++) {
              const spatialUnit = this.availableSpatialUnits[index];
              if(spatialUnit.spatialUnitId == spatialUnitId){
                this.availableSpatialUnits.splice(index, 1);
                break;
              }              
            }
            this.availableSpatialUnits_map.delete(spatialUnitId);
          };
          
          // REPORTING

          this.reportingIndicatorConfig = [];

					// GEORESOURCES

					this.availableGeoresources = [];
          this.displayableGeoresources = [];
          this.displayableGeoresources_keywordFiltered = [];
          this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {};

					this.selectedGeoresource;

					this.setGeoresources = function(georesourcesArray){
						this.availableGeoresources = georesourcesArray;

            this.availableGeoresources_map = new Map();
            for (const georesourceMetadata of georesourcesArray) {
              this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
            }

            this.displayableGeoresources = this.availableGeoresources.filter(item => self.isDisplayableGeoresource(item));
            this.displayableGeoresources_keywordFiltered = JSON.parse(JSON.stringify(this.displayableGeoresources));

            this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
            this.wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

            this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
              poiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isPOI),
              loiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isLOI),
              aoiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isAOI),
              wmsData: this.wmsDatasets_keywordFiltered,
              wfsData: this.wfsDatasets_keywordFiltered
            };
					};

          this.addSingleGeoresourceMetadata = function(georesourceMetadata){
            let tmpArray = [georesourceMetadata];
            Array.prototype.push.apply(tmpArray, this.availableGeoresources);
            this.availableGeoresources =  tmpArray;
            this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
          };

          this.replaceSingleGeoresourceMetadata = function(georesourceMetadata){
            for (let index = 0; index < this.availableGeoresources.length; index++) {
              let georesource = this.availableGeoresources[index];
              if(georesource.georesourceId == georesourceMetadata.georesourceId){
                this.availableGeoresources[index] = georesourceMetadata;
                break;
              }
            }
            this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
          };

          this.deleteSingleGeoresourceMetadata = function(georesourceId){
            for (let index = 0; index < this.availableGeoresources.length; index++) {
              const georesource = this.availableGeoresources[index];
              if(georesource.georesourceId == georesourceId){
                this.availableGeoresources.splice(index, 1);
                break;
              }              
            }
            this.availableGeoresources_map.delete(georesourceId);
          };

					// INDICATORS					

					this.availableIndicators = [];
          this.displayableIndicators = [];

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
            this.availableIndicators_map = new Map();
            
            for (const indicatorMetadata of indicatorsArray) {
              this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
            }
					};

          this.addSingleIndicatorMetadata = function(indicatorMetadata){
            let tmpArray = [indicatorMetadata];
            Array.prototype.push.apply(tmpArray, this.availableIndicators);
            this.availableIndicators =  tmpArray;
            this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
          };

          this.replaceSingleIndicatorMetadata = function(indicatorMetadata){
            for (let index = 0; index < this.availableIndicators.length; index++) {
              let indicator = this.availableIndicators[index];
              if(indicator.indicatorId == indicatorMetadata.indicatorId){
                this.availableIndicators[index] = indicatorMetadata;
                break;
              }
            }
            this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
          };

          this.deleteSingleIndicatorMetadata = function(indicatorId){
            for (let index = 0; index < this.availableIndicators.length; index++) {
              const indicator = this.availableIndicators[index];
              if(indicator.indicatorId == indicatorId){
                this.availableIndicators.splice(index, 1);
                break;
              }              
            }
            this.availableIndicators_map.delete(indicatorId);
          };


					// TOPICS

					this.availableTopics = [];

					this.selectedTopic;

					this.setTopics = function(topicsArray){
						this.availableTopics = topicsArray;
          };

          this.topicHierarchyContainsGeoresource = function(topic, georesourceMetadata){
            // luckily, the topicReference is defined exactly like for indicators
            // hence we can simply refer to that method

            return this.topicHierarchyContainsIndicator(topic, georesourceMetadata);
          };

          this.topicHierarchyContainsWms = function(topic, wmsMetadata){
            // luckily, the topicReference is defined exactly like for indicators
            // hence we can simply refer to that method

            return this.topicHierarchyContainsIndicator(topic, wmsMetadata);
          };

          this.topicHierarchyContainsWfs = function(topic, wfsMetadata){
            // luckily, the topicReference is defined exactly like for indicators
            // hence we can simply refer to that method

            return this.topicHierarchyContainsIndicator(topic, wfsMetadata);
          };

          this.topicHierarchyContainsIndicator = function(topic, indicatorMetadata){
            if(topic === null || topic === ""){
              if (indicatorMetadata.topicReference === null || indicatorMetadata.topicReference === "" || ! this.referencedTopicIdExists(indicatorMetadata.topicReference)){
                return true;
              }
              else{
                return false;
              }
            }

            if (topic.topicId === indicatorMetadata.topicReference){
              return true;
            }
            else{
              return this.anySubTopicContainsIndicator(topic, indicatorMetadata);
            }
          };

          this.anySubTopicContainsIndicator = function(topic, indicatorMetadata){
            var isContained = false;

            for (const subTopic of topic.subTopics) {
              isContained = this.topicHierarchyContainsIndicator(subTopic, indicatorMetadata);

              if(isContained){
                break;
              }
            }

            return isContained;
          };

          // topic may be null
          this.getGeoresourceDatasets = function(topic, georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){
            var availableGeoresources = this.getAvailableGeoresources(topic, georesourceNameFilter, showPOI, showLOI, showAOI); 
            var wmsDatasets = this.getAvailableWmsDatasets(topic, georesourceNameFilter, showWMS);
            var wfsDatasets = this.getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS);
            
            var datasets = availableGeoresources.concat(wmsDatasets).concat(wfsDatasets);
            return datasets;
          };

          this.getNumberOfGeoresources = function(topic, georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){

            var numberOfAvailableGeoresources = this.getNumberOfAvailableGeoresources(topic, georesourceNameFilter, showPOI, showLOI, showAOI); 
            var numberOfWmsDatasets = this.getNumberOfAvailableWmsDatasets(topic, georesourceNameFilter, showWMS);
            var numberOfWfsDatasets = this.getNumberOfAvailableWfsDatasets(topic, georesourceNameFilter, showWFS);
            
            var numberOfResources = numberOfAvailableGeoresources + numberOfWmsDatasets + numberOfWfsDatasets;
            return numberOfResources;
          };

          var filterGeoresourcesByTypes = function(georesourceMetadataArray, showPOI, showLOI, showAOI){

            if(!showPOI && !showLOI && !showAOI){
              return [];
            }

            return georesourceMetadataArray.filter(georesourceMetadata => { 
              if(georesourceMetadata.isPOI){
                if(showPOI){
                  return true;
                }
                else{
                  return false;
                }
              }
              else if(georesourceMetadata.isLOI){
                if(showLOI){
                  return true;
                }
                else{
                  return false;
                }
              }
              else if(georesourceMetadata.isAOI){
                if(showAOI){
                  return true;
                }
                else{
                  return false;
                }
              }
              else{
                return false;
              }
            });
          };

          this.getAvailableGeoresources = function(topic, georesourceNameFilter, showPOI, showLOI, showAOI){
            var georesources = [];

            var filteredGeoresources = this.availableGeoresources;

            filteredGeoresources = filterByGeoresourceNamesToHide(filteredGeoresources);
            
            if(georesourceNameFilter && georesourceNameFilter != ""){
              filteredGeoresources = filterArrayObjectsByValue(filteredGeoresources, georesourceNameFilter);									
            }

            filteredGeoresources = filterGeoresourcesByTypes(filteredGeoresources, showPOI, showLOI, showAOI);
            
            for (const georesourceMetadata of filteredGeoresources) {              
              if (this.topicHierarchyContainsGeoresource(topic, georesourceMetadata)){
                georesources.push(georesourceMetadata);
              }
            }

            return georesources;
          }; 

          this.getNumberOfAvailableGeoresources = function(topic, georesourceNameFilter, showPOI, showLOI, showAOI){
            return this.getAvailableGeoresources(topic, georesourceNameFilter, showPOI, showLOI, showAOI).length;
          };          

          this.getAvailableWmsDatasets = function(topic, georesourceNameFilter, showWMS){
            if(!showWMS){
              return [];
            }

            var wmsDatasets = [];

            var filteredWmsDatasets = this.wmsDatasets;
            
            if(georesourceNameFilter && georesourceNameFilter != ""){
              filteredWmsDatasets = filterArrayObjectsByValue(filteredWmsDatasets, georesourceNameFilter);									
            }
            
            for (const wmsMetadata of filteredWmsDatasets) {
              if (this.topicHierarchyContainsWms(topic, wmsMetadata)){
                wmsDatasets.push(wmsMetadata);
              }
            }

            return wmsDatasets;
          };

          this.getNumberOfAvailableWmsDatasets = function(topic, georesourceNameFilter, showWMS){
            if(!showWMS){
              return 0;
            }

            return this.getAvailableWmsDatasets(topic, georesourceNameFilter, showWMS).length;
          };

          this.getAvailableWfsDatasets = function(topic, georesourceNameFilter, showWFS){
            if(!showWFS){
              return [];
            }

            var wfsDatasets = [];

            var filteredWfsDatasets = this.wfsDatasets;
            
            if(georesourceNameFilter && georesourceNameFilter != ""){
              filteredWfsDatasets = filterArrayObjectsByValue(filteredWfsDatasets, georesourceNameFilter);									
            }
            
            for (const wfsMetadata of filteredWfsDatasets) {
              if (this.topicHierarchyContainsWms(topic, wfsMetadata)){
                wfsDatasets.push(wfsMetadata);
              }
            }

            return wfsDatasets;
          };

          this.getNumberOfAvailableWfsDatasets = function(topic, georesourceNameFilter, showWFS){
            if(!showWFS){
              return 0;
            }

            return this.getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS).length;
          };

          this.getNumberOfIndicators = function(topic, indicatorNameFilter){
            var numberOfIndicators = 0;

            var filteredIndicators = this.availableIndicators;
            
            if(indicatorNameFilter && indicatorNameFilter != ""){
              filteredIndicators = filterArrayObjectsByValue(this.availableIndicators, indicatorNameFilter);									
            }
            
            filteredIndicators = filterByIndicatorNamesToHide(filteredIndicators);
            
            for (const indicatorMetadata of filteredIndicators) {
              if (this.topicHierarchyContainsIndicator(topic, indicatorMetadata)){
                numberOfIndicators++;
              }
            }

            return numberOfIndicators;
          };

          var filterByIndicatorNamesToHide = function(filteredIndicators){

            return filteredIndicators.filter(indicatorMetadata => { 
              return isDisplayableIndicator(indicatorMetadata);
            });
          };

          var filterByGeoresourceNamesToHide = function(filteredGeoresources){

            return filteredGeoresources.filter(georesourceMetadata => { 
              return self.isDisplayableGeoresource(georesourceMetadata);
            });
          };

          var filterArrayObjectsByValue = function (array, string) {
              return array.filter(o => { 
                return Object.keys(o).some(k => { 
                  if (typeof o[k] === 'string') 
                    return o[k].toLowerCase().includes(string.toLowerCase()); 
                }); 
              });
          };

          this.getIndicatorMetadataById = function(indicatorId){
            return this.availableIndicators_map.get(indicatorId);
          };

          this.getGeoresourceMetadataById = function(georesourceId){
            return this.availableGeoresources_map.get(georesourceId);
          };

          this.getSpatialUnitMetadataById = function(spatialUnitId){
            return this.availableSpatialUnits_map.get(spatialUnitId);
          };

          this.getIndicatorAbbreviationFromIndicatorId = function(indicatorId){
            for (var indicatorMetadata of this.availableIndicators) {
              if (indicatorMetadata.indicatorId === indicatorId){
                return indicatorMetadata.abbreviation;
              }
            }
          };

          this.getIndicatorNameFromIndicatorId = function(indicatorId){
            for (var indicatorMetadata of this.availableIndicators) {
              if (indicatorMetadata.indicatorId === indicatorId){
                return indicatorMetadata.indicatorName;
              }
            }
          };

          this.getGeoresourceNameFromGeoresourceId = function(georesourceId){
            for (var georesourceMetadata of this.availableGeoresources) {
              if (georesourceMetadata.georesourceId === georesourceId){
                return georesourceMetadata.datasetName;
              }
            }
          };

          this.referencedTopicIdExists = function(topicId){
            var topicHierarchy = this.getTopicHierarchyForTopicId(topicId);

            if(topicHierarchy.length === 0){
              return false;
            }
            else{
              return true;
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

            //TODO revise metadata fecthing for protected endpoints
            // var usersPromise = this.fetchUsersMetadata();            
            var scriptsPromise = this.fetchIndicatorScriptsMetadata();
            var topicsPromise = this.fetchTopicsMetadata();
            var spatialUnitsPromise = this.fetchSpatialUnitsMetadata();
            var georesourcesPromise = this.fetchGeoresourcesMetadata();
            var indicatorsPromise = this.fetchIndicatorsMetadata();
            
            // var metadataPromises = [topicsPromise, usersPromise, rolesPromise, spatialUnitsPromise, georesourcesPromise, indicatorsPromise, scriptsPromise];
            var metadataPromises = [spatialUnitsPromise, georesourcesPromise, indicatorsPromise, topicsPromise, scriptsPromise];

            if (Auth.keycloak.authenticated){
              var rolesPromise = this.fetchRolesMetadata();
              metadataPromises.push(rolesPromise);
            }

            $q.all(metadataPromises).then(function successCallback(successArray) {

                  self.modifyIndicatorApplicableSpatialUnitsForLoginRoles();

                  self.buildHeadlineIndicatorHierarchy();
                  self.buildTopicIndicatorHierarchy();
                  self.topicIndicatorHierarchy_forOrderView = JSON.parse(JSON.stringify(self.topicIndicatorHierarchy));
                  self.buildComputationIndicatorHierarchy();

                  self.buildTopicGeoresourceHierarchy();

                  console.log("Metadata fetched. Call initialize event.");
      						onMetadataLoadingCompleted();

                  $timeout(function(){
                    $('.list-group-item > .collapseTrigger').on('click', function() {
                      $('.glyphicon', this)
                        .toggleClass('glyphicon-chevron-right')
                        .toggleClass('glyphicon-chevron-down');
      
                    });
                  });
      				}, function errorCallback(errorArray) {
                // todo error handling
                self.displayMapApplicationError("Beim Laden der erforderlichen Anwendungsdaten ist ein Fehler aufgetreten. Bitte wenden Sie sich an Ihren Administrator.");
                $rootScope.$broadcast("initialMetadataLoadingFailed", errorArray);
      			});

          };

          this.modifyIndicatorApplicableSpatialUnitsForLoginRoles = function(){
            var availableSpatialUnitNames = [];
            for (const spatialUnit of this.availableSpatialUnits) {
              availableSpatialUnitNames.push(spatialUnit.spatialUnitLevel);
            }
            for (const indicator of this.availableIndicators) {
              indicator.applicableSpatialUnits = indicator.applicableSpatialUnits.filter(applicableSpatialUnit => availableSpatialUnitNames.includes(applicableSpatialUnit.spatialUnitName)); 
            }

            this.displayableIndicators = this.availableIndicators.filter(item => isDisplayableIndicator(item));
            this.displayableIndicators_keywordFiltered = JSON.parse(JSON.stringify(this.displayableIndicators));
          };

          this.buildTopicsMap_indicators = function(indicatorTopics){
            var topicsMap = new Map();            

            for (const topic of indicatorTopics) {
              topicsMap.set(topic.topicId, []);
              if(topic.subTopics.length > 0){
                topicsMap = this.addSubTopicsToMap_indicators(topic.subTopics, topicsMap);
              }
            }

            return topicsMap;
          };

          this.buildTopicsMap_georesources = function(georesourceTopics){
            var topicsMap = new Map();            

            for (const topic of georesourceTopics) {
              topicsMap.set(topic.topicId, {
                poiDatasets: [],
                loiDatasets: [],
                aoiDatasets: [],
                wmsDatasets: [],
                wfsDatasets: []
              });
              if(topic.subTopics.length > 0){
                topicsMap = this.addSubTopicsToMap_georesources(topic.subTopics, topicsMap);
              }
            }

            topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, {
              poiDatasets: [],
              loiDatasets: [],
              aoiDatasets: [],
              wmsDatasets: [],
              wfsDatasets: []
            });

            return topicsMap;
          };

          this.addSubTopicsToMap_indicators = function(subTopicsArray, topicsMap){

            for (const subTopic of subTopicsArray) {
              topicsMap.set(subTopic.topicId, []);
              if(subTopic.subTopics.length > 0){
                topicsMap = this.addSubTopicsToMap_indicators(subTopic.subTopics, topicsMap);
              } 
            } 
            
            return topicsMap;
          };

          this.addSubTopicsToMap_georesources = function(subTopicsArray, topicsMap){

            for (const subTopic of subTopicsArray) {
              topicsMap.set(subTopic.topicId, {
                poiDatasets: [],
                loiDatasets: [],
                aoiDatasets: [],
                wmsDatasets: [],
                wfsDatasets: []
              });
              if(subTopic.subTopics.length > 0){
                topicsMap = this.addSubTopicsToMap_georesources(subTopic.subTopics, topicsMap);
              } 
            } 
            
            return topicsMap;
          };

          this.buildTopicGeoresourceHierarchy = function(){

            var georesourceTopics = JSON.parse(JSON.stringify(this.availableTopics)).filter(topic => topic.topicResource === "georesource");
            /*
            topicsMap.set(topic.topicId, {
                poiDatasets: [],
                loiDatasets: [],
                aoiDatasets: [],
                wmsDatasets: [],
                wfsDatasets: []
              })

              + special entry with key "unmapped" for all datasets without valid topic reference
            */
            var topicsMap = this.buildTopicsMap_georesources(georesourceTopics);
            

            // PROCESS GEORESOURCES
            var filteredGeoresources = this.displayableGeoresources_keywordFiltered;

            for (const georesourceMetadata of filteredGeoresources) {
              if (topicsMap.has(georesourceMetadata.topicReference)){
                var georesourceDatasets = topicsMap.get(georesourceMetadata.topicReference);
                
                if(georesourceMetadata.isPOI){
                  georesourceDatasets.poiDatasets.push(georesourceMetadata);
                }
                if(georesourceMetadata.isLOI){
                  georesourceDatasets.loiDatasets.push(georesourceMetadata);
                }
                if(georesourceMetadata.isAOI){
                  georesourceDatasets.aoiDatasets.push(georesourceMetadata);
                }                

                topicsMap.set(georesourceMetadata.topicReference, georesourceDatasets);
              }
              else{
                var georesourceDatasets_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
                
                if(georesourceMetadata.isPOI){
                  georesourceDatasets_unmapped.poiDatasets.push(georesourceMetadata);
                }
                if(georesourceMetadata.isLOI){
                  georesourceDatasets_unmapped.loiDatasets.push(georesourceMetadata);
                }
                if(georesourceMetadata.isAOI){
                  georesourceDatasets_unmapped.aoiDatasets.push(georesourceMetadata);
                }                

                topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, georesourceDatasets_unmapped);
              }
            }

            // PROCESS WMS and WFS
            for (const wmsMetadata of this.wmsDatasets_keywordFiltered) {
              if (topicsMap.has(wmsMetadata.topicReference)){
                var georesourceDatasets = topicsMap.get(wmsMetadata.topicReference);                
                georesourceDatasets.wmsDatasets.push(wmsMetadata);              

                topicsMap.set(wmsMetadata.topicReference, georesourceDatasets);
              }
              else{
                var georesourceDatasets_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
                
                georesourceDatasets_unmapped.wmsDatasets.push(wmsMetadata);               

                topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, georesourceDatasets_unmapped);
              }
            }

            // PROCESS WMS and WFS
            for (const wfsMetadata of this.wfsDatasets_keywordFiltered) {
              if (topicsMap.has(wfsMetadata.topicReference)){
                var georesourceDatasets = topicsMap.get(wfsMetadata.topicReference);                
                georesourceDatasets.wfsDatasets.push(wfsMetadata);              

                topicsMap.set(wfsMetadata.topicReference, georesourceDatasets);
              }
              else{
                var georesourceDatasets_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
                
                georesourceDatasets_unmapped.wfsDatasets.push(wfsMetadata);               

                topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, georesourceDatasets_unmapped);
              }
            }

            this.topicGeoresourceHierarchy = this.addGeoresourceDataToTopicHierarchy(georesourceTopics, topicsMap);
          };

          this.buildTopicIndicatorHierarchy = function(){

            var indicatorTopics = JSON.parse(JSON.stringify(this.availableTopics)).filter(topic => topic.topicResource === "indicator");
            var topicsMap = this.buildTopicsMap_indicators(indicatorTopics);

            var filteredIndicators = this.displayableIndicators_keywordFiltered;

            for (const indicatorMetadata of filteredIndicators) {
              if (topicsMap.has(indicatorMetadata.topicReference)){
                var indicatorArray = topicsMap.get(indicatorMetadata.topicReference);
                indicatorArray.push(indicatorMetadata);
                topicsMap.set(indicatorMetadata.topicReference, indicatorArray);
              }
            }

            this.topicIndicatorHierarchy = this.addIndicatorDataToTopicHierarchy(indicatorTopics, topicsMap);
          };

          this.addIndicatorDataToTopicHierarchy = function(topicsArray, topicsMap){
            for (var topic of topicsArray) {
              topic.indicatorData = topicsMap.get(topic.topicId);
              topic.indicatorData.sort((a,b) => (a.displayOrder > b.displayOrder) ? 1 : ((b.displayOrder > a.displayOrder) ? -1 : 0));
              topic.indicatorCount = topic.indicatorData.length;
              if(topic.subTopics.length > 0){
                topic = this.addIndicatorDataToSubTopics(topic, topicsMap);
              }
            }

            return topicsArray;
          };

          this.addIndicatorDataToSubTopics = function(topic, topicsMap){
            for (var subTopic of topic.subTopics) {
              subTopic.indicatorData = topicsMap.get(subTopic.topicId);
              subTopic.indicatorData.sort((a,b) => (a.displayOrder > b.displayOrder) ? 1 : ((b.displayOrder > a.displayOrder) ? -1 : 0));
              subTopic.indicatorCount = subTopic.indicatorData.length;              
              if(subTopic.subTopics.length > 0){
                subTopic = this.addIndicatorDataToSubTopics(subTopic, topicsMap);
              }
              topic.indicatorCount = topic.indicatorCount + subTopic.indicatorCount;
            }

            return topic;
          };

          this.addGeoresourceDataToTopicHierarchy = function(topicsArray, topicsMap){

            /*
            topicsMap.set(topic.topicId, {
                poiDatasets: [],
                loiDatasets: [],
                aoiDatasets: [],
                wmsDatasets: [],
                wfsDatasets: []
              })

              + special entry with key "unmapped" for all datasets without valid topic reference
            */

            for (var topic of topicsArray) {
              var topicsDataEntry = topicsMap.get(topic.topicId);
              topic.poiData = topicsDataEntry.poiDatasets;
              topic.poiCount = topicsDataEntry.poiDatasets.length;

              topic.loiData = topicsDataEntry.loiDatasets;
              topic.loiCount = topicsDataEntry.loiDatasets.length;

              topic.aoiData = topicsDataEntry.aoiDatasets;
              topic.aoiCount = topicsDataEntry.aoiDatasets.length;

              topic.wmsData = topicsDataEntry.wmsDatasets;
              topic.wmsCount = topicsDataEntry.wmsDatasets.length;

              topic.wfsData = topicsDataEntry.wfsDatasets;
              topic.wfsCount = topicsDataEntry.wfsDatasets.length;

              topic.totalCount = topic.poiCount + topic.loiCount + topic.aoiCount + topic.wmsCount + topic.wfsCount;
              topic.ownCount = topic.poiCount + topic.loiCount + topic.aoiCount + topic.wmsCount + topic.wfsCount;

              if(topic.subTopics.length > 0){
                topic = this.addGeoresourceDataToSubTopics(topic, topicsMap);
              }
            }

            // PROCESS UNMAPPED entries
            this.topicGeoresourceHierarchy_unmappedEntries = {};
            var topicsDataEntry_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
            this.topicGeoresourceHierarchy_unmappedEntries.poiData = topicsDataEntry_unmapped.poiDatasets;
            this.topicGeoresourceHierarchy_unmappedEntries.poiCount = topicsDataEntry_unmapped.poiDatasets.length;

            this.topicGeoresourceHierarchy_unmappedEntries.loiData = topicsDataEntry_unmapped.loiDatasets;
            this.topicGeoresourceHierarchy_unmappedEntries.loiCount = topicsDataEntry_unmapped.loiDatasets.length;

            this.topicGeoresourceHierarchy_unmappedEntries.aoiData = topicsDataEntry_unmapped.aoiDatasets;
            this.topicGeoresourceHierarchy_unmappedEntries.aoiCount = topicsDataEntry_unmapped.aoiDatasets.length;

            this.topicGeoresourceHierarchy_unmappedEntries.wmsData = topicsDataEntry_unmapped.wmsDatasets;
            this.topicGeoresourceHierarchy_unmappedEntries.wmsCount = topicsDataEntry_unmapped.wmsDatasets.length;

            this.topicGeoresourceHierarchy_unmappedEntries.wfsData = topicsDataEntry_unmapped.wfsDatasets;
            this.topicGeoresourceHierarchy_unmappedEntries.wfsCount = topicsDataEntry_unmapped.wfsDatasets.length;

            this.topicGeoresourceHierarchy_unmappedEntries.totalCount = this.topicGeoresourceHierarchy_unmappedEntries.poiCount + 
            this.topicGeoresourceHierarchy_unmappedEntries.loiCount + 
            this.topicGeoresourceHierarchy_unmappedEntries.aoiCount + 
            this.topicGeoresourceHierarchy_unmappedEntries.wmsCount + 
            this.topicGeoresourceHierarchy_unmappedEntries.wfsCount;

            return topicsArray;
          };

          this.addGeoresourceDataToSubTopics = function(topic, topicsMap){
            for (var subTopic of topic.subTopics) { 
              
              var topicsDataEntry = topicsMap.get(subTopic.topicId);
              subTopic.poiData = topicsDataEntry.poiDatasets;
              subTopic.poiCount = topicsDataEntry.poiDatasets.length;

              subTopic.loiData = topicsDataEntry.loiDatasets;
              subTopic.loiCount = topicsDataEntry.loiDatasets.length;

              subTopic.aoiData = topicsDataEntry.aoiDatasets;
              subTopic.aoiCount = topicsDataEntry.aoiDatasets.length;

              subTopic.wmsData = topicsDataEntry.wmsDatasets;
              subTopic.wmsCount = topicsDataEntry.wmsDatasets.length;

              subTopic.wfsData = topicsDataEntry.wfsDatasets;
              subTopic.wfsCount = topicsDataEntry.wfsDatasets.length;

              subTopic.totalCount = subTopic.poiCount + subTopic.loiCount + subTopic.aoiCount + subTopic.wmsCount + subTopic.wfsCount;
              subTopic.ownCount = subTopic.poiCount + subTopic.loiCount + subTopic.aoiCount + subTopic.wmsCount + subTopic.wfsCount;

              if(subTopic.subTopics.length > 0){
                subTopic = this.addGeoresourceDataToSubTopics(subTopic, topicsMap);
              }
              topic.poiCount = topic.poiCount + subTopic.poiCount;
              topic.loiCount = topic.loiCount + subTopic.loiCount;
              topic.aoiCount = topic.aoiCount + subTopic.aoiCount;
              topic.wmsCount = topic.wmsCount + subTopic.wmsCount;
              topic.wfsCount = topic.wfsCount + subTopic.wfsCount;
              topic.totalCount = topic.totalCount + subTopic.totalCount;
            }

            return topic;
          };

          this.onChangeIndicatorKeywordFilter = function(indicatorNameFilter){
            this.displayableIndicators_keywordFiltered = JSON.parse(JSON.stringify(this.displayableIndicators));

            if(indicatorNameFilter && indicatorNameFilter != ""){
              this.displayableIndicators_keywordFiltered = filterArrayObjectsByValue(this.displayableIndicators_keywordFiltered, indicatorNameFilter);									
            }

            this.buildTopicIndicatorHierarchy();
            this.buildHeadlineIndicatorHierarchy();
            this.buildComputationIndicatorHierarchy();             
          };

          this.onChangeGeoresourceKeywordFilter = function(georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){          
            this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
            this.wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

            this.displayableGeoresources_keywordFiltered = JSON.parse(JSON.stringify(this.displayableGeoresources));

            if(georesourceNameFilter && georesourceNameFilter != ""){
              this.displayableGeoresources_keywordFiltered = filterArrayObjectsByValue(this.displayableGeoresources_keywordFiltered, georesourceNameFilter);									
              
              this.wmsDatasets_keywordFiltered = filterArrayObjectsByValue(this.wmsDatasets_keywordFiltered, georesourceNameFilter);
              this.wfsDatasets_keywordFiltered = filterArrayObjectsByValue(this.wfsDatasets_keywordFiltered, georesourceNameFilter);
            }

            this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
              poiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isPOI),
              loiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isLOI),
              aoiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isAOI),
              wmsData: this.wmsDatasets_keywordFiltered,
              wfsData: this.wfsDatasets_keywordFiltered
            };

            if(!showWMS){
              this.wmsDatasets_keywordFiltered = [];
            }
            if(!showWFS){
              this.wfsDatasets_keywordFiltered = [];
            }

            if(! (showPOI && showLOI && showAOI)){
              this.displayableGeoresources_keywordFiltered = this.displayableGeoresources_keywordFiltered.filter(item => {
                if (! showPOI && item.isPOI){
                  return false;
                }
                if (! showLOI && item.isLOI){
                  return false;
                }

                if (! showAOI && item.isAOI){
                  return false;
                }

                return true;
              });
            }

            this.buildTopicGeoresourceHierarchy();          
          };

          this.buildHeadlineIndicatorHierarchy = function(){

            var indicatorsMap = new Map();

            var filteredIndicators = this.displayableIndicators_keywordFiltered;

            for (const indicatorMetadata of filteredIndicators) {
              indicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
            }
            
            var headlineIndicatorsArray = filteredIndicators.filter(indicatorMetadata => indicatorMetadata.isHeadlineIndicator == true);

            var headlineIndicatorsIdArray = headlineIndicatorsArray.map(indicatorMetadata => indicatorMetadata.indicatorId);

            var headlineIndicatorsMap = new Map();

            for (const indicatorMetadata of headlineIndicatorsArray) {
              headlineIndicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
            }

            var headlineIndicatorScriptsMap = new Map();
            for (const scriptMetadata of this.availableProcessScripts) {
              if(headlineIndicatorsIdArray.includes(scriptMetadata.indicatorId)){                
                headlineIndicatorScriptsMap.set(scriptMetadata.indicatorId, scriptMetadata);
              }
            }

            this.headlineIndicatorHierarchy = [];

            // var item = {
            //   headlineIndicator: {metadata}
            //   baseIndicators: [{metadata}]
            //   maybeSomeAnalysisItems?
            // }

            for (const headlineIndicatorMetadata of headlineIndicatorsArray) {
              var item = {};
              item.headlineIndicator = headlineIndicatorMetadata;
              item.baseIndicators = [];

              if(headlineIndicatorScriptsMap.has(headlineIndicatorMetadata.indicatorId)){
                var targetScriptMetadata = headlineIndicatorScriptsMap.get(headlineIndicatorMetadata.indicatorId);
                for (const requiredIndicatorId of targetScriptMetadata.requiredIndicatorIds) {
                  if (indicatorsMap.has(requiredIndicatorId)){
                    item.baseIndicators.push(indicatorsMap.get(requiredIndicatorId));
                  }                
                }
              }              

              this.headlineIndicatorHierarchy.push(item);
            }            

          };

          this.buildComputationIndicatorHierarchy = function(){

            var indicatorsMap = new Map();

            var filteredIndicators = this.displayableIndicators_keywordFiltered;

            for (const indicatorMetadata of filteredIndicators) {
              indicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
            }
            
            var computationIndicatorsArray = filteredIndicators.filter(indicatorMetadata => indicatorMetadata.creationType == "COMPUTATION");

            var computationIndicatorsIdArray = computationIndicatorsArray.map(indicatorMetadata => indicatorMetadata.indicatorId);

            var computationIndicatorsMap = new Map();

            for (const indicatorMetadata of computationIndicatorsArray) {
              computationIndicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
            }

            var computationIndicatorScriptsMap = new Map();
            for (const scriptMetadata of this.availableProcessScripts) {
              if(computationIndicatorsIdArray.includes(scriptMetadata.indicatorId)){                
                computationIndicatorScriptsMap.set(scriptMetadata.indicatorId, scriptMetadata);
              }
            }

            this.computationIndicatorHierarchy = [];

            // var item = {
            //   computationIndicator: {metadata}
            //   baseIndicators: [{metadata}]
            //   maybeSomeAnalysisItems?
            // }

            for (const computationIndicatorMetadata of computationIndicatorsArray) {
              var item = {};
              item.computationIndicator = computationIndicatorMetadata;
              item.baseIndicators = [];

              if(computationIndicatorScriptsMap.has(computationIndicatorMetadata.indicatorId)){
                var targetScriptMetadata = computationIndicatorScriptsMap.get(computationIndicatorMetadata.indicatorId);
                for (const requiredIndicatorId of targetScriptMetadata.requiredIndicatorIds) {
                  if (indicatorsMap.has(requiredIndicatorId)){
                    item.baseIndicators.push(indicatorsMap.get(requiredIndicatorId));
                  }                
                }
              }              

              this.computationIndicatorHierarchy.push(item);
            }            

          };

          this.filterCurrentlySelectedIndicator = function(){
						return function( item ) {

							if (item.indicatorMetadata.indicatorId === self.selectedIndicator.indicatorId){
								return true;
							}
							return false;
							
						  };
					};

					this.filterBaseIndicatorsOfCurrentHeadlineIndicator = function(){
						return function( item ) {

							var headlineIndicatorEntry = self.headlineIndicatorHierarchy.filter(element => element.headlineIndicator.indicatorId == self.selectedIndicator.indicatorId)[0];

							if(headlineIndicatorEntry){
								var baseIndicators_filtered = headlineIndicatorEntry.baseIndicators.filter(element => element.indicatorId == item.indicatorMetadata.indicatorId);
								if (baseIndicators_filtered.length > 0){
									return true;
								}
							}

							return false;
							
						  };
					};

					this.filterBaseIndicatorsOfCurrentComputationIndicator = function(){
						return function( item ) {

							var computationIndicatorEntry = self.computationIndicatorHierarchy.filter(element => element.computationIndicator.indicatorId == self.selectedIndicator.indicatorId)[0];

							if(computationIndicatorEntry){
								var baseIndicators_filtered = computationIndicatorEntry.baseIndicators.filter(element => element.indicatorId == item.indicatorMetadata.indicatorId);
								if (baseIndicators_filtered.length > 0){
									return true;
								}
							}

							return false;
							
						  };
					};

          var onMetadataLoadingCompleted = function(){

            $timeout(function () {
              $rootScope.$broadcast("initialMetadataLoadingCompleted");

              $timeout(function () {
                $("option").each(function (index, element) {
                  var text = $(element).text();
                  $(element).attr("title", text);
                });
              }, 1000);
            }, 1000);
            
            // setTimeout(() => {
            //   // $rootScope.$broadcast("initialMetadataLoadingCompleted");

                  
            // }, 1000);

              

          };

          this.setRoles = function(rolesArray){
            self.availableRoles = rolesArray;
            this.availableRoles_map = new Map();
            for (const roleMetadata of rolesArray) {
              this.availableRoles_map.set(roleMetadata.roleId, roleMetadata);
            }

            fetchedRolesInitially = true;
          };

          this.fetchRolesMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + rolesEndpoint,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                self.setRoles(response.data);
              });
          };

          this.fetchSingleRoleMetadata = function(targetRoleId){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + rolesEndpoint  + "/" + targetRoleId,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                return response.data;

              });
          };

          this.replaceSingleRoleMetadata = function(targetRoleMetadata){
            for (let index = 0; index < this.availableRoles.length; index++) {
              let roleMetadata = this.availableRoles[index];
              if(roleMetadata.roleId == targetRoleMetadata.roleId){
                this.availableRoles[index] = targetRoleMetadata;
                break;
              }
            }
            this.availableProcessScripts_map.set(targetRoleMetadata.roleId, targetRoleMetadata);
          };

          this.addSingleRoleMetadata = function(roleMetadata){
            let tmpArray = [roleMetadata];
            Array.prototype.push.apply(tmpArray, this.availableRoles);
            this.availableRoles =  tmpArray;
            this.availableProcessScripts_map.set(roleMetadata.roleId, roleMetadata);
          };

          this.deleteSingleRoleMetadata = function(roleId){
            for (let index = 0; index < this.availableRoles.length; index++) {
              const roleMetadata = this.availableRoles[index];
              if(roleMetadata.roleId == roleId){
                this.availableRoles.splice(index, 1);
                break;
              }              
            }
            this.availableProcessScripts_map.delete(roleId);
          };

          this.getRoleMetadataById = function(roleId){
            return this.availableRoles_map.get(roleId);
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

              });
          };

          this.fetchTopicsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + topicsPublicEndpoint,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setTopics(response.data);
                fetchedTopicsInitially = true;

              });
          };

          this.fetchSpatialUnitsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + spatialUnitsEndpoint,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setSpatialUnits(response.data);
                fetchedSpatialUnitsInitially = true;

              });
          };

          this.fetchSingleSpatialUnitMetadata = function(targetSpatialUnitId){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + spatialUnitsEndpoint  + "/" + targetSpatialUnitId,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                return response.data;

              });
          };

          this.fetchGeoresourcesMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + georesourcesEndpoint,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setGeoresources(response.data);
                fetchedGeoresourcesInitially = true;

              });
          };

          this.fetchSingleGeoresourceMetadata = function(targetGeoresourceId){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + georesourcesEndpoint  + "/" + targetGeoresourceId,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                return response.data;

              });
          };

          this.fetchIndicatorsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + indicatorsEndpoint,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setIndicators(response.data);
                fetchedIndicatorsInitially = true;

              });
          };

          this.fetchSingleIndicatorMetadata = function(targetIndicatorId){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + indicatorsEndpoint + "/" + targetIndicatorId,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                return response.data;

              });
          };

          this.fetchIndicatorScriptsMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + scriptsEndpoint,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.setProcessScripts(response.data);

              });
          };

          this.fetchSingleIndicatorScriptMetadata = function(targetScriptId){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + scriptsEndpoint  + "/" + targetScriptId,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                return response.data;

              });
          };

					this.indicatorValueIsNoData = function(indicatorValue){
						if(Number.isNaN(indicatorValue) || indicatorValue === null || indicatorValue === undefined){
							return true;
						}
						return false;
					};

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
							value = this.getIndicatorValue_asNumber(indicatorValue);
						}

						return value;
					};

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
						 	value = this.getIndicatorValue_asFormattedText(indicatorValue);
						}

						return value;
					};

					this.getIndicatorValue_asNumber = function(indicatorValue){
						var value;
						if(this.indicatorValueIsNoData(indicatorValue)){
							value = "NoData";
						}
						else{
							value = +Number(indicatorValue).toFixed(numberOfDecimals);
            }
            
            // if the original value is greater than zero but would be rounded as 0 then we must return the original result
            if(Number(value) == 0 && indicatorValue > 0){
              value = Number(indicatorValue);
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
            
            // if the original value is greater than zero but would be rounded as 0 then we must return the original result
            if(Number(value) == 0 && indicatorValue > 0){
              value = Number(indicatorValue).toLocaleString('de-DE');
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
                  whitespaceString += "&nbsp;";
                }
                topicsString += whitespaceString + topicHierarchyArray[index].topicName;
              }
  
              if (index < topicHierarchyArray.length) {
                topicsString += "<br/>";
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

          
          this.labelAllFeatures = "alle Features";
          this.labelFilteredFeatures = "gefilterte Features";
          this.labelSelectedFeatures = "selektierte Features";
          this.labelNumberOfFeatures = "Anzahl:"
          this.labelSum = "Summe:"
          this.labelMean = "arith. Mittel:"
          this.labelMin = "Minimalwert:"
          this.labelMax = "Maximalwert"

          this.allFeaturesNumberOfFeatures;
          this.allFeaturesSum;
          this.allFeaturesMean;
          this.allFeaturesMin;
          this.allFeaturesMax;
          this.selectedFeaturesNumberOfFeatures;
          this.selectedFeaturesSum;
          this.selectedFeaturesMean;
          this.selectedFeaturesMin;
          this.selectedFeaturesMax;
          this.allFeaturesPropertyUnit;

          this.setAllFeaturesProperty = function(indicatorMetadataAndGeoJSON, propertyName){
            let sum = 0;
            let count = 0;
            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;

            for (const feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
              if(! this.indicatorValueIsNoData(feature.properties[propertyName])){
                let value = this.getIndicatorValueFromArray_asNumber(feature.properties, propertyName)
                sum += value;
                if (value < min) min = value;
                if (value > max) max = value;
                count++;
              }
            }

            this.allFeaturesPropertyUnit = indicatorMetadataAndGeoJSON.unit;
            this.allFeaturesNumberOfFeatures = count;
            this.allFeaturesSum = this.getIndicatorValue_asFormattedText(sum);
            // no division by zero
            if (count > 0) 
              this.allFeaturesMean = this.getIndicatorValue_asFormattedText(sum / count);
            else 
              this.allFeaturesMean = 0;
            this.allFeaturesMin = this.getIndicatorValue_asFormattedText(min);
            this.allFeaturesMax = this.getIndicatorValue_asFormattedText(max)
          };

          
          this.setSelectedFeatureProperty = function(selectedFeaturesMap, propertyName) {
            let sum = 0;
            let count = 0
            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;
            
            selectedFeaturesMap.forEach(function(feature, key, map) {
              if(! thisService.indicatorValueIsNoData(feature.properties[propertyName])){
                let value = thisService.getIndicatorValueFromArray_asNumber(feature.properties, propertyName);
                sum += value;
                if (value < min) min = value;
                if (value > max) max = value;
                count++;
              }
            });

            if(count === 0) {
              // no feature selected, overwrite initial values for min and max
              min = 0;
              max = 0;
            }
            

            this.selectedFeaturesNumberOfFeatures = count;
            this.selectedFeaturesSum = this.getIndicatorValue_asFormattedText(sum);
            // no division by zero
            if (count > 0) 
              this.selectedFeaturesMean = this.getIndicatorValue_asFormattedText(sum / count);
            else 
              this.selectedFeaturesMean = 0;
            this.selectedFeaturesMin = this.getIndicatorValue_asFormattedText(min);
            this.selectedFeaturesMax = this.getIndicatorValue_asFormattedText(max);
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

          this.formatIndicatorNameForLabel = function(indicatorName, maxCharsPerLine){
            var arr = [];
            var space = /\s/;
         
            const words = indicatorName.split(space);
            // push first word into new array
            if (words[0].length) {
              arr.push(words[0]);
            }
         
            for (let i = 1; i < words.length; i++) {
              if (words[i].length + arr[arr.length - 1].length < maxCharsPerLine) {
                arr[arr.length - 1] = `${arr[arr.length - 1]} ${words[i
                         ]}`;
              } 
              else {
                arr.push(words[i]);
              }
            }
            return arr.join("\n");
          };

          this.filterIndicators = function (){
            return function( item ) {

              return isDisplayableIndicator(item);
            };
          };

          this.selectedSpatialUnitIsRaster = function(){
            var spatialUnitName = this.selectedSpatialUnit ? this.selectedSpatialUnit.spatialUnitLevel : "";

            return (spatialUnitName.includes("raster") || spatialUnitName.includes("Raster") || spatialUnitName.includes("RASTER") || spatialUnitName.includes("grid") || spatialUnitName.includes("GRID") || spatialUnitName.includes("Grid"));
          };

          this.filterGeoresources = function (){
            return function( item ) {

              return self.isDisplayableGeoresource(item);
            };
          };

          this.isDisplayableGeoresource = function(item){
            var arrayOfNameSubstringsForHidingGeoresources = __env.arrayOfNameSubstringsForHidingGeoresources;

              if(item.availablePeriodsOfValidity == undefined || item.availablePeriodsOfValidity.length === 0)
                return false;

                var isGeoresourceThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingGeoresources.some(substring => String(item.datasetName).includes(substring));

                if(isGeoresourceThatShallNotBeDisplayed){
                  return false;
                }
              return true;
         };

          this.selectedSpatialUnitIsRaster = function(){
            var spatialUnitName = this.selectedSpatialUnit ? this.selectedSpatialUnit.spatialUnitLevel : "";

            return (spatialUnitName.includes("raster") || spatialUnitName.includes("Raster") || spatialUnitName.includes("RASTER") || spatialUnitName.includes("grid") || spatialUnitName.includes("GRID") || spatialUnitName.includes("Grid"));
          };

          var roleMappingAllowsDisplay = function(indicatorMetadata){
            if(self.currentKeycloakLoginRoles.includes(kommonitorKeycloakHelperService.adminRoleName)){
              return true;
            }            
            var roleMetadataForCurrentKeycloakLoginRoles = self.availableRoles.filter(role => self.currentKeycloakLoginRoles.includes(role.roleName));            
            
            var filteredApplicableUnits = indicatorMetadata.applicableSpatialUnits.filter(function (applicableSpatialUnit) {
              return applicableSpatialUnit.allowedRoles.length == 0 || applicableSpatialUnit.allowedRoles.some(allowedRoleId => roleMetadataForCurrentKeycloakLoginRoles.some(roleMetadata => roleMetadata.roleId === allowedRoleId) );                
            });

            return filteredApplicableUnits.length > 0;
          };

          var isDisplayableIndicator = function(item){
             // var arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Prozentuale Ver"];
             var arrayOfNameSubstringsForHidingIndicators = __env.arrayOfNameSubstringsForHidingIndicators;

             // this is an item from i.e. indicatorRadar, that has a different structure
             if(item.indicatorMetadata){
               if(item.indicatorMetadata.applicableDates == undefined || item.indicatorMetadata.applicableDates.length === 0)
                 return false;

               if(item.indicatorMetadata.applicableSpatialUnits == undefined || item.indicatorMetadata.applicableSpatialUnits.length === 0)
                 return false;  

                 var isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(substring => String(item.indicatorMetadata.indicatorName).includes(substring));

                 if(isIndicatorThatShallNotBeDisplayed){
                   return false;
                 }

                 if(! roleMappingAllowsDisplay(item.indicatorMetadata)){
                   return false;
                 }

               return true;
             }
             else{
               //
               if(item.applicableDates == undefined || item.applicableDates.length === 0)
                 return false;

               if(item.applicableSpatialUnits == undefined || item.applicableSpatialUnits.length === 0)
                 return false;    

                 // var isIndicatorThatShallNotBeDisplayed = item.indicatorName.includes("Standardabweichung") || item.indicatorName.includes("Prozentuale Ver");
                 var isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(substring => String(item.indicatorName).includes(substring));

                 if(isIndicatorThatShallNotBeDisplayed){
                   return false;
                 }

                 if(! roleMappingAllowsDisplay(item)){
                  return false;
                }

               return true;
             }
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

          function getImageDimensions(file) {
            return new Promise (function (resolved, rejected) {
              var i = new Image();
              i.onload = function(){
                resolved({w: i.width, h: i.height})
              };
              i.src = file;
            });
          }

          /**
           * creates and returns a pdf for the indicator given as parameter
           */
          this.createMetadataPDF_indicator = async function(indicator) {

            var jspdf = new jsPDF();
            jspdf.setFontSize(16);
            // jspdf.text("Metadatenblatt", 70, 6);
  
            //insert logo
            var img = new Image();
            img.src = '/logos/KM_Logo1.png';
            jspdf.addImage(img, 'PNG', 193, 5, 12, 12);
  
            jspdf.setFontSize(16);
            jspdf.setFontStyle('bolditalic');
            var titleArray = jspdf.splitTextToSize("Indikator: " +indicator.indicatorName, 180);
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
  
            var category = "Basisindikator";
            if (indicator.isHeadlineIndicator) {
              category = "Leitindikator";
            }
  
            // Or JavaScript:
            jspdf.autoTable({
              head: [['Themenfeld', 'Kategorie', 'Typ', 'Kennzeichen']],
              body: [
                [topicsString, category, this.getIndicatorStringFromIndicatorType(indicator.indicatorType), indicator.abbreviation ? indicator.abbreviation : "-"]
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
  
                if (availableSpatialUnit.spatialUnitLevel === applicableSpatialUnit.spatialUnitName) {
                  spatialUnitsString += applicableSpatialUnit.spatialUnitName;
                  processedSpatialUnits++;
  
                  if (processedSpatialUnits < indicator.applicableSpatialUnits.length) {
                    spatialUnitsString += "\n";
                  }
                }
  
              }
            }
  
            var datesString = "";
  
            if(indicator.applicableDates.length <= 20){
              for (var [j, date] of indicator.applicableDates.entries()) {
                var asDate = new Date(date);
    
                datesString += this.tsToDate_withOptionalUpdateInterval(this.dateToTS(asDate), indicator.metadata.updateInterval);
    
                if (j < indicator.applicableDates.length - 1) {
                  datesString += "    ";
                }
              }
            }
            else{
              datesString += "Zeitreihe umfasst insgesamt " + indicator.applicableDates.length + " Zeitpunkte\n\n";

              datesString += "frühester Zeitpunkt: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(indicator.applicableDates[0]), indicator.metadata.updateInterval) + "\n";
              datesString += "spätester Zeitpunkt: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(indicator.applicableDates[indicator.applicableDates.length - 1]), indicator.metadata.updateInterval);
            
            }            

            var imgData;
            var imgWidth;
            var imgHeight;

            if(indicator.processDescription && indicator.processDescription.includes("$")){
              await html2canvas(document.querySelector("#indicatorProcessDescription")).then(canvas => {
                // document.body.appendChild(canvas)
  
                imgData = canvas.toDataURL('image/png');
            
              });

              var dimensions = await getImageDimensions(imgData);
              imgWidth = dimensions.w;
              imgHeight = dimensions.h;
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
              startY: jspdf.autoTable.previous.finalY + 10,
              willDrawCell: function(data) {
                if (imgData && data.row.index === 2 && data.column.index === 1 && data.cell.section === 'body') {                   
                   data.row.height = 2.5 * data.cell.height;
                   data.row.maxCellHeight = 2.5 * data.cell.height;
                   data.cell.height = 2.5 * data.cell.height;
                   data.cell.text = "";
                }
                if (imgData && data.row.index === 2 && data.column.index === 0 && data.cell.section === 'body') {                   
                  data.row.height = 2.5 * data.cell.height;
                  data.row.maxCellHeight = 2.5 * data.cell.height;
                  data.cell.height = 2.5 * data.cell.height;
               }
              },
              didDrawCell: function(data) {
                if (imgData && data.row.index === 2 && data.column.index === 1 && data.cell.section === 'body') {
                   var cellHeight = data.cell.height - data.cell.padding('vertical');
                   var cellWidth = data.cell.width - data.cell.padding('horizontal');
                   var textPos = data.cell.textPos;

                   var imgScale = cellHeight / imgHeight;
                   var width = imgWidth * imgScale;
                   if (width > cellWidth){
                     width = cellWidth;
                   }

                   jspdf.addImage(imgData, "PNG", textPos.x,  textPos.y, width, cellHeight);
                }
              }
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
                ["Hinweise zum Referenzdatum", indicator.referenceDateNote ? indicator.referenceDateNote : "-"],
                ["Verfügbare Zeitreihen", datesString],
                ["Datum der letzten Aktualisierung", this.tsToDate_withOptionalUpdateInterval(this.dateToTS(indicator.metadata.lastUpdate))],
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

            return jspdf;
          };

          /**
           * creates and returns a pdf for the georesource given as parameter
           */
           this.createMetadataPDF_georesource = async function(georesource) {

            var jspdf = new jsPDF();
            jspdf.setFontSize(16);
            // jspdf.text("Metadatenblatt", 70, 6);
  
            //insert logo
            var img = new Image();
            img.src = '/logos/KM_Logo1.png';
            jspdf.addImage(img, 'PNG', 193, 5, 12, 12);
  
            jspdf.setFontSize(16);
            jspdf.setFontStyle('bolditalic');
            var titleArray = jspdf.splitTextToSize("Geodatensatz: " + georesource.datasetName, 180);
            jspdf.text(titleArray, 14, 25);
  
  
            jspdf.setFontSize(11);
  
            var initialStartY = 30;
  
            if (titleArray.length > 1) {
              titleArray.forEach(function (item) {
                initialStartY += 5;
              });
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
  
            var topicReferenceId = georesource.topicReference;
  
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
  
            var category = "Punkt";
            if (georesource.isLOI) {
              category = "Linie";
            }
            else if(georesource.isAOI){
              category = "Fläche";
            }
  
            // Or JavaScript:
            jspdf.autoTable({
              head: [['Themenfeld', 'Datentyp', 'letzte Aktualisierung']],
              body: [
                [topicsString, category, this.tsToDate_withOptionalUpdateInterval(this.dateToTS(georesource.metadata.lastUpdate))]
                // ...
              ],
              theme: 'grid',
              headStyles: headStyles,
              bodyStyles: bodyStyles,
              startY: initialStartY
            });
  
            var datesString = "";
  
            if(georesource.availablePeriodsOfValidity.length <= 10){
              for (var [j, period] of georesource.availablePeriodsOfValidity.entries()) {

                var startDate = new Date(period.startDate);
                var endDate = period.endDate? new Date(period.endDate) : undefined;
    
                datesString += "Zeitspanne: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(startDate));
                if(endDate){
                  datesString += " - " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(endDate));
                }
                else{
                  datesString += "- 'null' (demnach gültig bis auf weiteres)";
                }
    
                if (j < georesource.availablePeriodsOfValidity.length - 1) {
                  datesString += "\n";
                }
              }
            }
            else{
              datesString += "insgesamt " + georesource.availablePeriodsOfValidity.length + " Zeitspannen\n\n";

              var earliestStartDate;
              var latestEndDate = -1; // my be null --> enc init with -1

              for (var [j, period] of georesource.availablePeriodsOfValidity.entries()) {

                if(! earliestStartDate){
                  earliestStartDate = new Date(period.startDate);
                }
                else{
                  if(new Date(period.startDate) < earliestStartDate){
                    earliestStartDate = new Date(period.startDate);
                  }
                }
                
                if(latestEndDate == -1){
                  if(period.endDate){
                    latestEndDate = new Date(period.endDate);
                  }
                  else if(period.endDate == null){
                    latestEndDate = null;
                  }
                  
                }
                else{
                  if(latestEndDate && period.endDate && new Date(period.endDate) > latestEndDate){
                    latestEndDate = new Date(period.endDate);
                  }
                }
              }

              datesString += "frühestes Startdatum: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(earliestStartDate)) + "\n";
              if(latestEndDate != null && latestEndDate != -1){
                datesString += "spätestes Enddatum: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(latestEndDate)) + "\n";
              }
              else{
                datesString += "spätestes Enddatum: ohne explizites Enddatum (demnach gültig bis auf weiteres)\n";
              }
              

            }            
  
            // linked elements
            jspdf.autoTable({
              head: [],
              body: [
                ["Beschreibung", georesource.metadata.description],
                ["Datengrundlage", georesource.metadata.databasis ? georesource.metadata.databasis : "-"],
                ["Datenquelle", georesource.metadata.datasource ? georesource.metadata.datasource : "-"],
                ["Datenhalter und Kontakt", georesource.metadata.contact ? georesource.metadata.contact : "-"],
                ["Bemerkung", georesource.metadata.note ? georesource.metadata.note : "-"],
                // $scope.updateInteval is a map mapping the english KEYs to german expressions
                ["Zeitbezug / Fortführungsintervall", this.updateInterval.get(georesource.metadata.updateInterval.toUpperCase())],
                ["Verfügbare Gültigkeitszeiträume", datesString],
                ["Quellen / Literatur", georesource.metadata.literature ? georesource.metadata.literature : "-"]
              ],
              theme: 'grid',
              headStyles: headStyles,
              bodyStyles: bodyStyles,
              columnStyles: columnStyles,
              startY: jspdf.autoTable.previous.finalY + 10
            });
  
            var pdfName = georesource.datasetName + ".pdf";
  
            jspdf.setProperties({
              title: 'KomMonitor Geodatenblatt',
              subject: pdfName,
              author: 'KomMonitor',
              keywords: 'Geodaten, Metadatenblatt',
              creator: 'KomMonitor'
            });

            jspdf.save(pdfName);
            return jspdf;
          };

          // this.getIndicatorStringFromIndicatorType = function (indicator) {
          //   var indicatorTypeString;
          //   if (indicator.indicatorType.includes("DYNAMIC_ABSOLUTE")) {
          //     indicatorTypeString = "Dynamik-Indikator (absolute)";
          //   }
          //   else if (indicator.indicatorType.includes("DYNAMIC_RELATIVE")) {
          //     indicatorTypeString = "Dynamik-Indikator (relativ)";
          //   }
          //   else if (indicator.indicatorType.includes("DYNAMIC_STANDARDIZED")) {
          //     indicatorTypeString = "Dynamik-Indikator (standardisiert)";
          //   }
          //   else if (indicator.indicatorType.includes("STATUS_ABSOLUTE")) {
          //     indicatorTypeString = "Status-Indikator (absolut)";
          //   }
          //   else if (indicator.indicatorType.includes("STATUS_RELATIVE")) {
          //     indicatorTypeString = "Status-Indikator (relativ)";
          //   }
          //   else if (indicator.indicatorType.includes("STATUS_STANDARDIZED")) {
          //     indicatorTypeString = "Status-Indikator (standardisiert)";
          //   }
  
          //   return indicatorTypeString;
          // };

          this.dateToTS = function(date) {
            if(date){
              return date.valueOf();
            }
            
          };
  
          this.tsToDate = function(ts) {
            if(ts){
              var date = new Date(ts);
  
            return date.toLocaleDateString("de-DE", {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            }            
          };
  
          this.tsToDate_withOptionalUpdateInterval = function(ts, updateIntervalApiName) {
            if(ts){
              var date = new Date(ts);
  
            /**
            * TODO FIXME dateSLider formatter will return only year for now to prevent misleading month and day settings
            */
  
            // return date.getFullYear();

            if(updateIntervalApiName){
              if(updateIntervalApiName.toLowerCase() === "yearly"){
                return date.getFullYear();
              }
              else if(updateIntervalApiName.toLowerCase() === "half_yearly"){
                return (date.getMonth() + 1) + "/" +  date.getFullYear();                
              }
              else if(updateIntervalApiName.toLowerCase() === "monthly"){
                return (date.getMonth() + 1) + "/" +  date.getFullYear();
              }
              // else if(updateIntervalApiName.toLowerCase() === "weekly"){
              //   return date.toLocaleDateString("de-DE", {
              //     year: 'numeric',
              //     month: 'short',
              //     day: 'numeric'
              //   });
              // }
              // else if(updateIntervalApiName.toLowerCase() === "daily"){
              //   return date.toLocaleDateString("de-DE", {
              //     year: 'numeric',
              //     month: 'short',
              //     day: 'numeric'
              //   });
              // }
              else if(updateIntervalApiName.toLowerCase() === "quarterly"){
                var year = date.getFullYear();
                var month = date.getMonth();
                if(month < 4){
                  return "Q1/" + year;
                }
                else if(month < 7){
                  return "Q2/" + year;
                }
                else if(month < 10){
                  return "Q3/" + year;
                }
                else {
                  return "Q4/" + year;
                }
              }
              else{
                // includes daily and weekly, as they are presented equally
                return date.toLocaleDateString("de-DE", {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              }
            }
            else{
              return date.toLocaleDateString("de-DE", {
            		year: 'numeric',
            		month: 'short',
            		day: 'numeric'
              });
            }
  
            }            
          };

          this.getSpatialUnitIdFromSpatialUnitName = function(name) {
            let result = null;
            $(this.availableSpatialUnits).each( (id, obj) => {
              if (obj.spatialUnitLevel === name) {
                result = obj.spatialUnitId;
                return false;
              }
            });
            return result;
          }

          /**
		 * creates an array of objects from an array of strings.
		 * each object in the result has the properties "category" and "name"
		 * 
		 * example:
		 * convert ["s1", "s2", ...]    ===>    [{category: "s1",name: "s1"}, {category: "s2", name: "s2"}, ...]
		 * @param {array} array 
		 */
		this.createDualListInputArray = function(array, nameProperty, idProperty) {
			var result = [];

      if(array && Array.isArray(array)){
        for (var i=0;i<array.length;i++) {
          var obj = {};
          obj["category"] = array[i][nameProperty];
          obj["name"] = array[i][nameProperty];
          if(idProperty && array[i][idProperty]){
            obj["id"] = array[i][idProperty];
          }
          result.push(obj);
        }
      }
			
			return result;
		};

		this.initializeRoleDualListConfig = function(inputArray, selectedArray, nameProperty) {
			var duallistRoleOptions = {
				label: 'Rollen',
				boxItemsHeight: 'md',
				items: this.createDualListInputArray(inputArray, nameProperty),
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: this.createDualListInputArray(selectedArray, nameProperty)
			};

				// remove those timestamps from left side
				duallistRoleOptions.items = duallistRoleOptions.items.filter(
					function(unselectedItem) {
						return !duallistRoleOptions.selectedItems.find(
							function(selectedItem) {
								return unselectedItem.name === selectedItem.name;
							}
						);
					}
        );
        
        return duallistRoleOptions;
    };
    
    this.getRoleMetadataForRoleName = function(roleName){
      for (const roleMetadata of this.availableRoles) {
        if(roleMetadata.roleName === roleName){
          return roleMetadata;
        }
      }
    };

    this.getRoleMetadataForRoleId = function(roleId){
      for (const roleMetadata of this.availableRoles) {
        if(roleMetadata.roleId === roleId){
          return roleMetadata;
        }
      }
    };

    this.getRoleMetadataForRoleIds = function(roleIdsArray){
      var rolesMetadata = [];
      for (const roleMetadata of this.availableRoles) {
        if(roleIdsArray.includes(roleMetadata.roleId)){
          rolesMetadata.push(roleMetadata);
        }
      }

      return rolesMetadata;
    };

    $rootScope.$on("onAddedFeatureToSelection", function (event, selectedIndicatorFeatureIds) {
      let propertyName = buildIndicatorPropertyName();

      $timeout(function(params) {
        thisService.setSelectedFeatureProperty(selectedIndicatorFeatureIds, propertyName);
      });
    });

    $rootScope.$on("onRemovedFeatureFromSelection", function (event, selectedIndicatorFeatureIds) {
      let propertyName = buildIndicatorPropertyName();

      $timeout(function(params) {
        thisService.setSelectedFeatureProperty(selectedIndicatorFeatureIds, propertyName);
      });
    });

    function buildIndicatorPropertyName() {
      const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
      let propertyName = INDICATOR_DATE_PREFIX + thisService.selectedDate;
      return propertyName;
    }
}]);
