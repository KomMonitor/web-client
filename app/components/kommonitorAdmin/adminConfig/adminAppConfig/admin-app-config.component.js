angular.module('adminAppConfig').component('adminAppConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminAppConfig/admin-app-config.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', 'kommonitorConfigStorageService', '$scope', '$rootScope', '__env', '$http', '$timeout', function AppConfigController(kommonitorDataExchangeService, kommonitorScriptHelperService, kommonitorConfigStorageService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;			
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;
		this.kommonitorConfigStorageServiceInstance = kommonitorConfigStorageService;
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;
		$scope.codeMirrorEditor = undefined;

		$scope.missingRequiredParameters = [];
		$scope.missingRequiredParameters_string = "";

		$scope.keywordsInConfig = ["window.__env", "window.__env.appTitle", "window.__env.enableKeycloakSecurity", "window.__env.encryption", "window.__env.adminUserName", 
			"window.__env.adminPassword", "window.__env.FEATURE_ID_PROPERTY_NAME", "window.__env.FEATURE_NAME_PROPERTY_NAME", 
			"window.__env.VALID_START_DATE_PROPERTY_NAME", "window.__env.VALID_END_DATE_PROPERTY_NAME", "window.__env.indicatorDatePrefix",
			"window.__env.apiUrl", "window.__env.targetUrlToProcessingEngine", "window.__env.targetUrlToReachabilityService_ORS",
			"window.__env.targetUrlToImporterService", "window.__env.simplifyGeometriesParameterName", "window.__env.simplifyGeometriesOptions", 
			"window.__env.simplifyGeometries", "window.__env.numberOfDecimals", "window.__env.initialLatitude", "window.__env.initialLongitude",
			"window.__env.initialZoomLevel", "window.__env.minZoomLevel", "window.__env.maxZoomLevel", "window.__env.baseLayers", "window.__env.initialIndicatorId",
			"window.__env.initialSpatialUnitName", "window.__env.useTransparencyOnIndicator", "window.__env.useOutlierDetectionOnIndicator",
			"window.__env.classifyZeroSeparately", "window.__env.classifyUsingWholeTimeseries", "window.__env.updateIntervalOptions", 
			"window.__env.indicatorCreationTypeOptions", "window.__env.indicatorUnitOptions", "window.__env.indicatorTypeOptions", 
			"window.__env.wmsDatasets", "window.__env.wfsDatasets", "window.__env.isAdvancedMode", "window.__env.showAdvancedModeSwitch",
			"window.__env.customLogoURL", "window.__env.customLogo_onClickURL", "window.__env.customLogoWidth", "window.__env.customGreetingsContact_name",
			"window.__env.customGreetingsContact_organisation", "window.__env.customGreetingsContact_mail"];

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
			
			$scope.initCodeEditor();

			$scope.onChangeAppConfig();

			$scope.$digest();
		};

		$scope.initCodeEditor = function(){
			$scope.codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("appConfigEditor"), {
				lineNumbers: true,
				autoRefresh:true,
				mode: "javascript",
				gutters: ["CodeMirror-lint-markers"],
				lint: {
					"getAnnotations": $scope.validateCode,
					"async": true 
				}
			  });

			 $scope.codeMirrorEditor.setSize(null, 450); 

			 $scope.codeMirrorEditor.on('change',function(cMirror){
			   // get value right from instance
			   $scope.appConfigTmp = $scope.codeMirrorEditor.getValue();			   
			 }); 

			 $scope.codeMirrorEditor.setValue($scope.appConfigCurrent);
		};

		$scope.validateCode = function(cm, updateLinting, options){
			// call the built in css linter from addon/lint/css-lint.js
			try {
				$scope.lintingIssues = CodeMirror.lint.javascript(cm, options);

				updateLinting($scope.lintingIssues);					
			} catch (error) {
				console.error("Error while linting app config script code. Error is: \n" + error);
			}

			$scope.onChangeAppConfig();
            
		};

		$scope.resetDefaultConfig = async function(){
			$scope.appConfigCurrent = $scope.appConfigTemplate;
			$scope.appConfigNew = $scope.appConfigTemplate;
			$scope.appConfigTmp = $scope.appConfigTemplate;

			$scope.onChangeAppConfig();

			  // update config on server
			$scope.editAppConfig();  

			$scope.codeMirrorEditor.setValue($scope.appConfigCurrent);
		};

		$scope.isConfigSettingInvalid = function(configString){
			var isInvalid = true;

			isInvalid = ! $scope.keywordsInConfig.every(keyword => configString.includes(keyword));
			$scope.missingRequiredParameters = $scope.keywordsInConfig.filter(keyword => ! configString.includes(keyword));
			$scope.missingRequiredParameters_string = JSON.stringify($scope.missingRequiredParameters);			

			if ($scope.lintingIssues && $scope.lintingIssues.length > 0){
				var errors = $scope.lintingIssues.filter(issue => issue.severity === 'error');
				if(errors && errors.length > 0){
					isInvalid = true;
				}				
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
					'javascript', true);
			}, 250);

			$timeout(function(){
				$scope.$digest();
			});
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
						'javascript', true);
				}, 250);

				$("#appConfigEditSuccessAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$digest();
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
					$scope.$digest();
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
