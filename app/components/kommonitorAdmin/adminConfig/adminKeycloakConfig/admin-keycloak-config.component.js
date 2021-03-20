angular.module('adminKeycloakConfig').component('adminKeycloakConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminKeycloakConfig/admin-keycloak-config.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', 'kommonitorConfigStorageService', '$scope', '$rootScope', '__env', '$http', '$timeout', function KeycloakConfigController(kommonitorDataExchangeService, kommonitorScriptHelperService, kommonitorConfigStorageService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;	
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;
		$scope.codeMirrorEditor = undefined;

		$scope.keywordsInConfig = ["realm", "auth-server-url", "http", "/auth", "resource", "ssl-required", "public-client", "confidential-port", "admin-rolename", "admin-rolepassword"];

		$scope.keycloakConfigTemplate = undefined;
		$scope.keycloakConfigTmp = undefined;
		$scope.keycloakConfigCurrent = undefined;
		$scope.keycloakConfigNew = undefined;

		$scope.configSettingInvalid = false;

		$scope.init = async function(){
			await $http.get('./config/keycloak_backup_withComments.txt', {'responseType': 'text'}).then(function (response) {
				// $scope.keycloakConfigTemplate = JSON.stringify(response.data, null, "    ");
				$scope.keycloakConfigTemplate = response.data;

				kommonitorScriptHelperService.prettifyScriptCodePreview("keycloakConfig_backupTemplate");
			  });

			  // set in app.js
			$scope.keycloakConfigTmp = JSON.stringify(__env.keycloakConfig, null, "    ");
			$scope.keycloakConfigCurrent = JSON.stringify(__env.keycloakConfig, null, "    ");
			$scope.keycloakConfigNew = JSON.stringify(__env.keycloakConfig, null, "    ");
			kommonitorScriptHelperService.prettifyScriptCodePreview("keycloakConfig_current");	
			
			$scope.initCodeEditor();

			$scope.onChangeKeycloakConfig();

			$scope.$digest();
		};

		$scope.initCodeEditor = function(){
			$scope.codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("keycloakConfigEditor"), {
				lineNumbers: true,
				autoRefresh:true,
				mode: "application/json",
				gutters: ["CodeMirror-lint-markers"],
				lint: {
					"getAnnotations": $scope.validateCode,
					"async": true 
				}
			  });

			 $scope.codeMirrorEditor.setSize(null, 220); 

			 $scope.codeMirrorEditor.on('change',function(cMirror){
			   // get value right from instance
			   $scope.keycloakConfigTmp = $scope.codeMirrorEditor.getValue();			   
			 }); 

			 $scope.codeMirrorEditor.setValue($scope.keycloakConfigCurrent);
		};

		$scope.validateCode = function(cm, updateLinting, options){
			// call the built in css linter from addon/lint/css-lint.js
			try {
				$scope.lintingIssues = CodeMirror.lint.json(cm, options);

				updateLinting($scope.lintingIssues);					
			} catch (error) {
				console.error("Error while linting keycloak config json code. Error is: \n" + error);
			}

			$scope.onChangeKeycloakConfig();
            
		};

		$scope.isConfigSettingInvalid = function(configString){
			var isInvalid = true;

			isInvalid = ! $scope.keywordsInConfig.every(keyword => configString.includes(keyword));

			if ($scope.lintingIssues && $scope.lintingIssues.length > 0){
				isInvalid = true;			
			}

			return isInvalid;

		};

		$scope.resetDefaultConfig = async function(){
			await $http.get('./config/keycloak_backup.json', {'responseType': 'json'}).then(function (response) {
				$scope.keycloakConfigTmp = JSON.stringify(response.data, null, "    ");
				$scope.keycloakConfigCurrent = JSON.stringify(response.data, null, "    ");
				$scope.keycloakConfigNew = JSON.stringify(response.data, null, "    ");
			  });

			  $scope.onChangeKeycloakConfig();

			  // update config on server
			$scope.editKeycloakConfig();  

			$scope.codeMirrorEditor.setValue($scope.keycloakConfigCurrent);
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
					'javascript', true);
			}, 250);

			$timeout(function(){
				$scope.$digest();
			});
		};

		$scope.init();

		$scope.editKeycloakConfig = async function(){
			$timeout(function () {
				$scope.loadingData = true;
			});

			$scope.errorMessagePart = undefined;

			try {
				var addConfigResponse = await kommonitorConfigStorageService.postKeycloakConfig($scope.keycloakConfigTmp);	
				
				var newCurrentConfig = await kommonitorConfigStorageService.getKeycloakConfig();
				$timeout(function(){
					$scope.keycloakConfigCurrent = JSON.stringify(newCurrentConfig, null, "    ");
				});				
	
				$timeout(function(){				
					// kommonitorScriptHelperService.prettifyScriptCodePreview("keycloakConfig_new");	
					document.getElementById('keycloakConfig_current').innerHTML = 
						PR.prettyPrintOne($scope.keycloakConfigCurrent,
						'javascript', true);
				}, 250);

				$("#keycloakConfigEditSuccessAlert").show();
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

				$("#keycloakConfigEditErrorAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$digest();
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
