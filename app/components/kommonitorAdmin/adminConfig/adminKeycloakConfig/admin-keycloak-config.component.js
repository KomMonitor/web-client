angular.module('adminKeycloakConfig').component('adminKeycloakConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminKeycloakConfig/admin-keycloak-config.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', 'kommonitorConfigStorageService', '$scope', '$rootScope', '__env', '$http', '$timeout', function KeycloakConfigController(kommonitorDataExchangeService, kommonitorScriptHelperService, kommonitorConfigStorageService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;	
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.keywordsInConfig = ["realm", "auth-server-url", "http", "/auth", "resource", "ssl-required", "public-client", "confidential-port", "admin-rolename", "admin-rolepassword"];

		$scope.keycloakConfigTemplate = undefined;
		$scope.keycloakConfigTmp = undefined;
		$scope.keycloakConfigCurrent = undefined;
		$scope.keycloakConfigNew = undefined;

		$scope.configSettingInvalid = false;

		$scope.init = async function(){
			await $http.get('./config/keycloak_backup.json', {'responseType': 'json'}).then(function (response) {
				$scope.keycloakConfigTemplate = JSON.stringify(response.data, null, "    ");

				kommonitorScriptHelperService.prettifyScriptCodePreview("keycloakConfig_backupTemplate");
			  });

			  // set in app.js
			$scope.keycloakConfigTmp = JSON.stringify(__env.keycloakConfig, null, "    ");
			$scope.keycloakConfigCurrent = JSON.stringify(__env.keycloakConfig, null, "    ");
			$scope.keycloakConfigNew = JSON.stringify(__env.keycloakConfig, null, "    ");
			kommonitorScriptHelperService.prettifyScriptCodePreview("keycloakConfig_current");			

			$scope.onChangeKeycloakConfig();

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

		$scope.onChangeKeycloakConfig = function(){
			// check by searching for keywords

			var configString = $scope.keycloakConfigTmp;			

			if(typeof configString === 'object' && configString !== null){
				configString = JSON.stringify(configString, null, "    ");
			}		

			$scope.configSettingInvalid = $scope.isConfigSettingInvalid(configString);

			$timeout(function(){
				$scope.keycloakConfigNew = configString;
			});

			$timeout(function(){				
				// kommonitorScriptHelperService.prettifyScriptCodePreview("keycloakConfig_new");	
				document.getElementById('keycloakConfig_new').innerHTML = 
					PR.prettyPrintOne($scope.keycloakConfigNew,
					'javascript');
			}, 250);
		};

		$scope.init();

		$scope.editKeycloakConfig = async function(){
			$timeout(function () {
				$scope.loadingData = true;
			});

			$scope.errorMessagePart = undefined;

			try {
				var addScriptResponse = await kommonitorConfigStorageService.postKeycloakConfig($scope.keycloakConfigTmp);	
				
				var newCurrentConfig = await kommonitorConfigStorageService.getKeycloakConfig();
				$timeout(function(){
					$scope.keycloakConfigCurrent = JSON.stringify(newCurrentConfig, null, "    ");
				});				
	
				$timeout(function(){				
					// kommonitorScriptHelperService.prettifyScriptCodePreview("keycloakConfig_new");	
					document.getElementById('keycloakConfig_current').innerHTML = 
						PR.prettyPrintOne($scope.keycloakConfigCurrent,
						'javascript');
				}, 250);

				$("#keycloakConfigEditSuccessAlert").show();
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

				$("#keycloakConfigEditErrorAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$apply();
				}, 250);
			}

		};

		$scope.hideSuccessAlert = function () {
			$("#keycloakConfigEditSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#keycloakConfigEditErrorAlert").hide();
		};

	}
	]
});
