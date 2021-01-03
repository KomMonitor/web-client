angular.module('adminAppConfig').component('adminAppConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminAppConfig/admin-app-config.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', 'kommonitorConfigStorageService', '$scope', '$rootScope', '__env', '$http', '$timeout', function AppConfigController(kommonitorDataExchangeService, kommonitorScriptHelperService, kommonitorConfigStorageService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;			
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;
		this.kommonitorConfigStorageServiceInstance = kommonitorConfigStorageService;
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.loadingData = true;

		$scope.keywordsInConfig = ["window.__env", "window.__env.enableKeycloakSecurity", "window.__env.encryption", "window.__env.adminUserName", 
			"window.__env.adminPassword", "window.__env.FEATURE_ID_PROPERTY_NAME", "window.__env.FEATURE_NAME_PROPERTY_NAME", 
			"window.__env.VALID_START_DATE_PROPERTY_NAME", "window.__env.VALID_END_DATE_PROPERTY_NAME", "window.__env.indicatorDatePrefix",
			"window.__env.apiUrl", "window.__env.targetUrlToProcessingEngine", "window.__env.targetUrlToReachabilityService_ORS",
			"window.__env.targetUrlToImporterService", "window.__env.simplifyGeometriesParameterName", "window.__env.simplifyGeometriesOptions", 
			"window.__env.simplifyGeometries", "window.__env.numberOfDecimals", "window.__env.initialLatitude", "window.__env.initialLongitude",
			"window.__env.initialZoomLevel", "window.__env.minZoomLevel", "window.__env.maxZoomLevel", "window.__env.baseLayers", "window.__env.initialIndicatorId",
			"window.__env.initialSpatialUnitName", "window.__env.useTransparencyOnIndicator", "window.__env.useOutlierDetectionOnIndicator",
			"window.__env.classifyZeroSeparately", "window.__env.classifyUsingWholeTimeseries", "window.__env.updateIntervalOptions", 
			"window.__env.indicatorCreationTypeOptions", "window.__env.indicatorUnitOptions", "window.__env.indicatorTypeOptions", 
			"window.__env.wmsDatasets", "window.__env.wfsDatasets"];

		$scope.appConfigTemplate = undefined;
		$scope.appConfigTmp = undefined;
		$scope.appConfigCurrent = undefined;
		$scope.appConfigNew = undefined;

		$scope.configSettingInvalid = false;

		$scope.init = async function(){
			await $http.get('./config/env_backup.js', {'responseType': 'text'}).then(function (response) {
				$scope.appConfigTemplate = response.data;

				kommonitorScriptHelperService.prettifyScriptCodePreview("appConfig_backupTemplate");
			  });

			  // set in app.js
			$scope.appConfigTmp = __env.appConfig;
			$scope.appConfigCurrent = __env.appConfig;
			$scope.appConfigNew = __env.appConfig;
			kommonitorScriptHelperService.prettifyScriptCodePreview("appConfig_current");			

			$scope.onChangeAppConfig();

			$scope.$apply();
		};

		$scope.isConfigSettingInvalid = function(configString){
			var isInvalid = true;

			isInvalid = ! $scope.keywordsInConfig.every(keyword => configString.includes(keyword));

			try {
				var parsedJavascript = acorn.parse(configString);

				console.log();

			} catch (error) {
				isInvalid = true;
			}

			return isInvalid;

		};

		$scope.onChangeAppConfig = function(){
			// check by searching for keywords

			var configString = $scope.appConfigTmp;				

			$scope.configSettingInvalid = $scope.isConfigSettingInvalid(configString);

			$timeout(function(){
				$scope.appConfigNew = configString;
			});

			$timeout(function(){				
				// kommonitorScriptHelperService.prettifyScriptCodePreview("appConfig_new");	
				document.getElementById('appConfig_new').innerHTML = 
					PR.prettyPrintOne($scope.appConfigNew,
					'javascript');
			}, 250);
		};

		$scope.init();

		$scope.editAppConfig = async function(){
			$timeout(function () {
				$scope.loadingData = true;
			});

			$scope.errorMessagePart = undefined;

			try {
				var addConfigResponse = await kommonitorConfigStorageService.postAppConfig($scope.appConfigTmp);	
				
				var newCurrentConfig = await kommonitorConfigStorageService.getAppConfig();
				$timeout(function(){
					$scope.appConfigCurrent = newCurrentConfig;
				});				
	
				$timeout(function(){				
					// kommonitorScriptHelperService.prettifyScriptCodePreview("appConfig_new");	
					document.getElementById('appConfig_current').innerHTML = 
						PR.prettyPrintOne($scope.appConfigCurrent,
						'javascript');
				}, 250);

				$("#appConfigEditSuccessAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$apply();
				}, 250);
			} catch (error) {
				if (error.data) {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#appConfigEditErrorAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$apply();
				}, 250);
			}

		};

		$scope.hideSuccessAlert = function () {
			$("#appConfigEditSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#appConfigEditErrorAlert").hide();
		};

	}
	]
});
