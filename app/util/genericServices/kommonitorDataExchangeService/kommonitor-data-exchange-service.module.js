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
		.module('kommonitorDataExchange', ['datatables'])
		.service(
				'kommonitorDataExchangeService', ['$rootScope', '$timeout', 'kommonitorMapService', 'kommonitorKeycloakHelperService', '$http', '__env', 'DTOptionsBuilder', '$q', 'Auth',
				function($rootScope, $timeout,
						kommonitorMapService, kommonitorKeycloakHelperService, $http, __env, DTOptionsBuilder, $q, Auth,) {              

              this.customLogoURL = __env.customLogoURL;
              this.customLogo_onClickURL = __env.customLogo_onClickURL;
              this.customLogoWidth = __env.customLogoWidth; 
              this.customGreetingsContact_name = __env.customGreetingsContact_name;
              this.customGreetingsContact_organisation = __env.customGreetingsContact_organisation;
              this.customGreetingsContact_mail = __env.customGreetingsContact_mail;
              this.customGreetingsTextInfoMessage = __env.customGreetingsTextInfoMessage; // maybe undefined or empty string

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

          this.enableKeycloakSecurity = __env.enableKeycloakSecurity;
          this.currentKeycloakLoginRoles = [];
          this.currentKomMonitorLoginRoleNames = [];

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

          this.datatablesOptions = DTOptionsBuilder.newOptions()
      				.withPaginationType('full_numbers')
      				.withDisplayLength(5)
      				.withLanguageSource('./Datatables.Language.German.json')
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
              "dashArrayValue" : "20 10 5 10"
            },
            {
              "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="5"/></svg>',
              "dashArrayValue" : "5"
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

          this.useOutlierDetectionOnIndicator = __env.useOutlierDetectionOnIndicator;
          this.classifyZeroSeparately = __env.classifyZeroSeparately;
          this.classifyUsingWholeTimeseries = __env.classifyUsingWholeTimeseries;

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

                  console.log("Metadata fetched. Call initialize event.");
      						onMetadataLoadingCompleted();
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

          this.fetchRolesMetadata = function(){
            return $http({
              url: this.baseUrlToKomMonitorDataAPI + rolesEndpoint,
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                self.availableRoles = response.data;
                fetchedRolesInitially = true;

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

          this.fetchGeoresourcesMetadata = function(){
            console.log("request: " + this.baseUrlToKomMonitorDataAPI + georesourcesEndpoint);
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

          this.totalFeaturesPropertyValue;
          this.totalFeaturesPropertyUnit;
          this.totalFeaturesPropertyLabel;

          this.setTotalFeaturesProperty = function(indicatorMetadataAndGeoJSON, propertyName){
            var sum = 0;
            var count = 0;

            for (const feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
              if(! this.indicatorValueIsNoData(feature.properties[propertyName])){
                sum += this.getIndicatorValueFromArray_asNumber(feature.properties, propertyName);
                count++;
              }
            }

            this.totalFeaturesPropertyUnit = indicatorMetadataAndGeoJSON.unit;

            if(indicatorMetadataAndGeoJSON.indicatorType.includes("ABSOLUTE") || indicatorMetadataAndGeoJSON.indicatorType.includes("DYNAMIC")){
              this.totalFeaturesPropertyValue = this.getIndicatorValue_asFormattedText(sum);
              this.totalFeaturesPropertyLabel = "Summe aller Features";
            }
            else{
              this.totalFeaturesPropertyValue = this.getIndicatorValue_asFormattedText(sum / count);     
              this.totalFeaturesPropertyLabel = "Arithmetisches Mittel aller Features";         
            }  
            
          };
            
          this.getColorFromBrewInstance = function(brewInstance, feature, targetDate){
            var color;
            for (var index=0; index < brewInstance.breaks.length; index++){

              if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) == this.getIndicatorValue_asNumber(brewInstance.breaks[index])){
                if(index < brewInstance.breaks.length -1){
                  // min value
                  color =  brewInstance.colors[index];
                  break;
                }
                else {
                  //max value
                  if (brewInstance.colors[index]){
                    color =  brewInstance.colors[index];
                  }
                  else{
                    color =  brewInstance.colors[index - 1];
                  }
                  break;
                }
              }
              else{
                if(this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) < this.getIndicatorValue_asNumber(brewInstance.breaks[index + 1])) {
                  color =  brewInstance.colors[index];
                  break;
                }
              }
            }

            return color;
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
            else if(this.classifyZeroSeparately && this.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) === 0 ){
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
                color = this.getColorFromBrewInstance(gtMeasureOfValueBrew, feature, targetDate);                
              }
              else {
                color = this.getColorFromBrewInstance(ltMeasureOfValueBrew, feature, targetDate);
              }

            }
            else{
              if(indicatorMetadataAndGeoJSON.indicatorType.includes('DYNAMIC')){

                if(feature.properties[targetDate] < 0){
                  
                  color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
                }
                else{
                  color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
                }

              }
              else{

                if(containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, targetDate)){
                  if(this.getIndicatorValue_asNumber(feature.properties[targetDate]) >= 0){
                    if(this.classifyZeroSeparately && (feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0")){
                      color = defaultColorForZeroValues;
                      if(useTransparencyOnIndicator){
                        fillOpacity = defaultFillOpacityForZeroFeatures;
                      }
                    }
                    else{
                      color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
                    }
                  }
                  else{
                    if(this.classifyZeroSeparately && (feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0")){
                      color = defaultColorForZeroValues;
                      if(useTransparencyOnIndicator){
                        fillOpacity = defaultFillOpacityForZeroFeatures;
                      }
                    }
                    else{
                      color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
                    }
                  }
                }
                else{
                  color = this.getColorFromBrewInstance(defaultBrew, feature, targetDate);                 
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

          /**
           * creates and returns a pdf for the indicator given as parameter
           */
          this.createMetadataPDF = async function(indicator) {

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
  
            var category = "Basisindikator";
            if (indicator.isHeadingIndicator) {
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
  
            for (var [j, date] of indicator.applicableDates.entries()) {
  
              var dateComponents = date.split("-");
              var asDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));
  
              datesString += this.tsToDate_fullYear(this.dateToTS(asDate));
  
              if (j < indicator.applicableDates.length - 1) {
                datesString += "\n";
              }
            }

            var imgData;

            if(indicator.processDescription && indicator.processDescription.includes("$")){
              await html2canvas(document.querySelector("#indicatorProcessDescription")).then(canvas => {
                // document.body.appendChild(canvas)
  
                imgData = canvas.toDataURL('image/png');
            
              });
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
              didDrawCell: function(data) {
                if (imgData && data.row.index === 2 && data.column.index === 1 && data.cell.section === 'body') {
                   var td = data.cell.raw;
                   var height = data.cell.height - data.cell.padding('vertical');
                   var width = data.cell.width - data.cell.padding('horizontal');
                   var textPos = data.cell.textPos;
                   jspdf.addImage(imgData, "PNG", textPos.x,  textPos.y, width, height);
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
  
          this.tsToDate_fullYear = function(ts) {
            if(ts){
              var date = new Date(ts);
  
            /**
            * TODO FIXME dateSLider formatter will return only year for now to prevent misleading month and day settings
            */
  
            // return date.getFullYear();
  
            return date.toLocaleDateString("de-DE", {
            		year: 'numeric',
            		month: 'long',
            		day: 'numeric'
            });
            }            
          };

          /**
		 * creates an array of objects from an array of strings.
		 * each object in the result has the properties "category" and "name"
		 * 
		 * example:
		 * convert ["s1", "s2", ...]    ===>    [{category: "s1",name: "s1"}, {category: "s2", name: "s2"}, ...]
		 * @param {array} array 
		 */
		this.createDualListInputArray = function(array, nameProperty) {
			var result = [];

      if(array && Array.isArray(array)){
        for (var i=0;i<array.length;i++) {
          var obj = {};
          obj["category"] = array[i][nameProperty];
          obj["name"] = array[i][nameProperty];
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


				}]);
