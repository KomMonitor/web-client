angular.module('adminFilterConfig').component('adminFilterConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminFilterConfig/admin-filter-config.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', 'kommonitorConfigStorageService', 'kommonitorDataGridHelperService', '$scope', '$rootScope', '__env', '$http', '$timeout', 
    function FilterConfigController(kommonitorDataExchangeService, kommonitorScriptHelperService, kommonitorConfigStorageService, kommonitorDataGridHelperService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;	
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;
		this.kommonitorConfigStorageServiceInstance = kommonitorConfigStorageService;		
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;
		$scope.codeMirrorEditor = undefined;

		$scope.missingRequiredParameters = [];
		$scope.missingRequiredParameters_string = "";

		$scope.keywordsInConfig = [];

		$scope.filterConfigTemplate = undefined;
		$scope.filterConfigTmp = undefined;
		$scope.filterConfigCurrent = undefined;
		$scope.filterConfigNew = undefined;

		$scope.configSettingInvalid = false;

		$scope.init = async function(){
			await $http.get('./config/filter-config_backup_forAdminViewExplanation.txt', {'responseType': 'text'}).then(function (response) {
				$scope.filterConfigTemplate = response.data;

				kommonitorScriptHelperService.prettifyScriptCodePreview("filterConfig_backupTemplate");
			  });

			  // set in app.js
			$scope.filterConfigTmp = JSON.stringify(__env.filterConfig, null, "    ");
			$scope.filterConfigCurrent = JSON.stringify(__env.filterConfig, null, "    ");
			$scope.filterConfigNew = JSON.stringify(__env.filterConfig, null, "    ");
			kommonitorScriptHelperService.prettifyScriptCodePreview("filterConfig_current");	
			
			$scope.initCodeEditor();

			$scope.onChangeFilterConfig();

			$timeout(function(){
				
				$scope.initializeOrRefreshOverviewTable();
			}, 250);

			$scope.$digest();
		};

		$scope.initializeOrRefreshOverviewTable = function(){
			$scope.loadingData = true;
			console.log(kommonitorDataExchangeService.availableSpatialUnits);
			kommonitorDataGridHelperService.buildDataGrid_globalFilter(kommonitorDataExchangeService.availableSpatialUnits);

			$timeout(function(){
				
				$scope.loadingData = false;
			});	
		};

		$scope.initCodeEditor = function(){
			$scope.codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("filterConfigEditor"), {
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
			   $scope.filterConfigTmp = $scope.codeMirrorEditor.getValue();			   
			 }); 

			 $scope.codeMirrorEditor.setValue($scope.filterConfigCurrent);
		};

		$scope.validateCode = function(cm, updateLinting, options){
			// call the built in css linter from addon/lint/css-lint.js
			try {
				$scope.lintingIssues = CodeMirror.lint.json(cm, options);

				updateLinting($scope.lintingIssues);					
			} catch (error) {
				console.error("Error while linting filter config json code. Error is: \n" + error);
			}

			$scope.onChangeFilterConfig();
            
		};

		$scope.resetDefaultConfig = async function(){
			$scope.filterConfigCurrent = $scope.filterConfigTemplate;
			$scope.filterConfigNew = $scope.filterConfigTemplate;
			$scope.filterConfigTmp = $scope.filterConfigTemplate;

			$scope.onChangeFilterConfig();

			  // update config on server
			$scope.editFilterConfig(); 
			
			$scope.codeMirrorEditor.setValue($scope.filterConfigCurrent);
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

		$scope.onChangeFilterConfig = function(){
			// check by searching for keywords

			var configString = $scope.filterConfigTmp;			

			if(typeof configString === 'object' && configString !== null){
				configString = JSON.stringify(configString, null, "    ");
			}		

			$scope.configSettingInvalid = $scope.isConfigSettingInvalid(configString);

			$timeout(function(){
				$scope.filterConfigNew = configString;
			});

			$timeout(function(){				
				document.getElementById('filterConfig_new').innerHTML = 
					PR.prettyPrintOne($scope.filterConfigNew,
					'javascript', true);
			}, 250);

			$timeout(function(){
				$scope.$digest();
			});
		};

		$scope.init();

		$scope.editFilterConfig = async function(){
			$timeout(function () {
				$scope.loadingData = true;
			});

			$scope.errorMessagePart = undefined;

			try {
				var addConfigResponse = await kommonitorConfigStorageService.postFilterConfig($scope.filterConfigTmp);	
				
				var newCurrentConfig = await kommonitorConfigStorageService.getFilterConfig();
				$timeout(function(){
					$scope.filterConfigCurrent = JSON.stringify(newCurrentConfig, null, "    ");
				});				
	
				$timeout(function(){				
					document.getElementById('filterConfig_current').innerHTML = 
						PR.prettyPrintOne($scope.filterConfigCurrent,
						'javascript', true);
				}, 250);

				$("#filterConfigEditSuccessAlert").show();
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

				$("#filterConfigEditErrorAlert").show();
				$scope.loadingData = false;

				setTimeout(() => {
					$scope.$digest();
				}, 250);
			}

		};

		$scope.hideSuccessAlert = function () {
			$("#filterConfigEditSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#filterConfigEditErrorAlert").hide();
		};

	}
	]
});
