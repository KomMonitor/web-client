angular.module('adminControlsConfig').component('adminControlsConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminControlsConfig/admin-controls-config.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', 'kommonitorConfigStorageService', '$scope', '$rootScope', '__env', '$http', '$timeout', function ControlsConfigController(kommonitorDataExchangeService, kommonitorScriptHelperService, kommonitorConfigStorageService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;	
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;
		this.kommonitorConfigStorageServiceInstance = kommonitorConfigStorageService;		
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;
		$scope.codeMirrorEditor = undefined;

		$scope.missingRequiredParameters = [];
		$scope.missingRequiredParameters_string = "";

		$scope.keywordsInConfig = ["id", "roles", "indicatorConfig", "poi", "dataImport", "filter", "measureOfValueClassification", "balance", "diagrams", "radarDiagram", "regressionDiagram", "reachability", "processing"];

		$scope.controlsConfigTemplate = undefined;
		$scope.controlsConfigTmp = undefined;
		$scope.controlsConfigCurrent = undefined;
		$scope.controlsConfigNew = undefined;

		$scope.configSettingInvalid = false;

		$scope.init = async function(){
			await $http.get('./config/controls-config_backup_forAdminViewExplanation.json', {'responseType': 'json'}).then(function (response) {
				$scope.controlsConfigTemplate = JSON.stringify(response.data, null, "    ");

				kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_backupTemplate");
			  });

			  // set in app.js
			$scope.controlsConfigTmp = JSON.stringify(__env.controlsConfig, null, "    ");
			$scope.controlsConfigCurrent = JSON.stringify(__env.controlsConfig, null, "    ");
			$scope.controlsConfigNew = JSON.stringify(__env.controlsConfig, null, "    ");
			kommonitorScriptHelperService.prettifyScriptCodePreview("controlsConfig_current");	
			
			$scope.initCodeEditor();

			$scope.onChangeControlsConfig();

			$scope.$digest();
		};

		$scope.initCodeEditor = function(){
			$scope.codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("controlsConfigEditor"), {
				lineNumbers: true,
				autoRefresh:true,
				mode: "application/json",
				gutters: ["CodeMirror-lint-markers"],
				lint: {
					"getAnnotations": $scope.validateCode,
					"async": true 
				}
			  });

			 $scope.codeMirrorEditor.setSize(null, 300); 

			 $scope.codeMirrorEditor.on('change',function(cMirror){
			   // get value right from instance
			   $scope.controlsConfigTmp = $scope.codeMirrorEditor.getValue();			   
			 }); 

			 $scope.codeMirrorEditor.setValue($scope.controlsConfigCurrent);
		};

		$scope.validateCode = function(cm, updateLinting, options){
			// call the built in css linter from addon/lint/css-lint.js
			try {
				$scope.lintingIssues = CodeMirror.lint.json(cm, options);

				updateLinting($scope.lintingIssues);					
			} catch (error) {
				console.error("Error while linting controls config json code. Error is: \n" + error);
			}

			$scope.onChangeControlsConfig();
            
		};

		$scope.resetDefaultConfig = async function(){
			$scope.controlsConfigCurrent = $scope.controlsConfigTemplate;
			$scope.controlsConfigNew = $scope.controlsConfigTemplate;
			$scope.controlsConfigTmp = $scope.controlsConfigTemplate;

			$scope.onChangeControlsConfig();

			  // update config on server
			$scope.editControlsConfig(); 
			
			$scope.codeMirrorEditor.setValue($scope.controlsConfigCurrent);
		};

		$scope.isConfigSettingInvalid = function(configString){
			var isInvalid = true;

			isInvalid = ! $scope.keywordsInConfig.every(keyword => configString.includes(keyword));
			$scope.missingRequiredParameters = $scope.keywordsInConfig.filter(keyword => ! configString.includes(keyword));
			$scope.missingRequiredParameters_string = JSON.stringify($scope.missingRequiredParameters);	

			if ($scope.lintingIssues && $scope.lintingIssues.length > 0){
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
					'javascript', true);
			}, 250);

			$timeout(function(){
				$scope.$digest();
			});
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
						'javascript', true);
				}, 250);

				$("#controlsConfigEditSuccessAlert").show();
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

				$("#controlsConfigEditErrorAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$digest();
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
