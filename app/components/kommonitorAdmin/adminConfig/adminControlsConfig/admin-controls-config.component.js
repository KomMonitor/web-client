angular.module('adminControlsConfig').component('adminControlsConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminControlsConfig/admin-controls-config.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', 'kommonitorConfigStorageService', '$scope', '$rootScope', '__env', '$http', '$timeout', function ControlsConfigController(kommonitorDataExchangeService, kommonitorScriptHelperService, kommonitorConfigStorageService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;	
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;
		this.kommonitorConfigStorageServiceInstance = kommonitorConfigStorageService;		
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.keywordsInConfig = ["id", "roles", "indicatorConfig", "poi", "dataImport", "filter", "measureOfValueClassification", "balance", "diagrams", "radarDiagram", "regressionDiagram", "reachability", "processing"];

		$scope.controlsConfigTemplate = undefined;
		$scope.controlsConfigTmp = undefined;
		$scope.controlsConfigCurrent = undefined;
		$scope.controlsConfigNew = undefined;

		$scope.configSettingInvalid = false;

		$scope.init = async function(){
			await $http.get('./config/controls-config_backup.json', {'responseType': 'json'}).then(function (response) {
				$scope.controlsConfigTemplate = JSON.stringify(response.data, null, "    ");

				kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_backupTemplate");
			  });

			  // set in app.js
			$scope.controlsConfigTmp = JSON.stringify(__env.controlsConfig, null, "    ");
			$scope.controlsConfigCurrent = JSON.stringify(__env.controlsConfig, null, "    ");
			$scope.controlsConfigNew = JSON.stringify(__env.controlsConfig, null, "    ");
			kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_current");			

			$scope.onChangeControlsConfig();

			$scope.$apply();
		};

		$scope.isConfigSettingInvalid = function(configString){
			var isInvalid = true;

			isInvalid = ! $scope.keywordsInConfig.every(keyword => configString.includes(keyword));

			try {
				var json = JSON.parse(configString);

				if(typeof json === 'object' && json !== null){
					// all good as far as we can tell
					// at least it can be parsed as any JSON object that is not null 
				}
				else{
					isInvalid = true;
				}
			} catch (error) {
				isInvalid = true;
			}

			return isInvalid;

		};

		$scope.onChangeControlsConfig = function(){
			// check by searching for keywords

			var configString = $scope.controlsConfigTmp;			

			if(typeof configString === 'object' && configString !== null){
				configString = JSON.stringify(configString, null, "    ");
			}		

			$scope.configSettingInvalid = $scope.isConfigSettingInvalid(configString);

			$timeout(function(){
				$scope.controlsConfigNew = configString;
			});

			$timeout(function(){				
				// kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_new");	
				document.getElementById('controlsConfig_new').innerHTML = 
					PR.prettyPrintOne($scope.controlsConfigNew,
					'javascript');
			}, 250);
		};

		$scope.init();

		$scope.editControlsConfig = async function(){
			$timeout(function () {
				$scope.loadingData = true;
			});

			$scope.errorMessagePart = undefined;

			try {
				var addConfigResponse = await kommonitorConfigStorageService.postControlsConfig($scope.controlsConfigTmp);	
				
				var newCurrentConfig = await kommonitorConfigStorageService.getControlsConfig();
				$timeout(function(){
					$scope.controlsConfigCurrent = JSON.stringify(newCurrentConfig, null, "    ");
				});				
	
				$timeout(function(){				
					// kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_new");	
					document.getElementById('controlsConfig_current').innerHTML = 
						PR.prettyPrintOne($scope.controlsConfigCurrent,
						'javascript');
				}, 250);

				$("#controlsConfigEditSuccessAlert").show();
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

				$("#controlsConfigEditErrorAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$apply();
				}, 250);
			}

		};

		$scope.hideSuccessAlert = function () {
			$("#controlsConfigEditSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#controlsConfigEditErrorAlert").hide();
		};

	}
	]
});
