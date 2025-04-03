angular.module('scriptAddModal').component('scriptAddModal', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/script-add-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', 
		'__env', '$timeout','kommonitorMultiStepFormHelperService',
		function ScriptAddModalAddModalController(kommonitorDataExchangeService, kommonitorScriptHelperService, 
			$scope, $rootScope, $http, __env, $timeout, kommonitorMultiStepFormHelperService) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			/*	POST BODY
				{
						"scriptCodeBase64": "scriptCodeBase64",
						"requiredIndicatorIds": [
							"requiredIndicatorIds",
							"requiredIndicatorIds"
						],
						"variableProcessParameters": [
							{
							"minParameterValueForNumericInputs": 6.027456183070403,
							"maxParameterValueForNumericInputs": 0.8008281904610115,
							"defaultValue": "defaultValue",
							"dataType": "string",
							"name": "name",
							"description": "description"
							},
							{
							"minParameterValueForNumericInputs": 6.027456183070403,
							"maxParameterValueForNumericInputs": 0.8008281904610115,
							"defaultValue": "defaultValue",
							"dataType": "string",
							"name": "name",
							"description": "description"
							}
						],
						"associatedIndicatorId": "associatedIndicatorId",
						"name": "name",
						"description": "description",
						"requiredGeoresourceIds": [
							"requiredGeoresourceIds",
							"requiredGeoresourceIds"
						]
						}
			*/

			$scope.datasetName = undefined;
			$scope.description = undefined;
			kommonitorScriptHelperService.targetIndicator = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$scope.errorMessagePart_indicatorMetadata = undefined;

			$scope.loadingData = false;

			$scope.selectedScriptType = null;

			kommonitorScriptHelperService.scriptData = [];

			$scope.init = async function () {
				kommonitorScriptHelperService.availableScriptTypeOptions = await kommonitorScriptHelperService.getScriptTypes();
			}

			$scope.init();

			$scope.resetScriptAddForm = function () {

				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;
				$scope.errorMessagePart_indicatorMetadata = undefined;

				$scope.datasetName = undefined;
				$scope.description = undefined;
				kommonitorScriptHelperService.targetIndicator = undefined;

				kommonitorScriptHelperService.reset();

				setTimeout(() => {
					$scope.$digest();
				}, 1000);
			};

			$scope.onScriptTypeChanged = function () {
				kommonitorScriptHelperService.getProcessDescription($scope.selectedScriptType.id);
			}

			$scope.addScript = async function () {

				$timeout(function () {
					$scope.loadingData = true;
				});

				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;
				$scope.errorMessagePart_indicatorMetadata = undefined;


				// TODO Create and perform POST Request with loading screen

				try {
					var addScriptResponse = await kommonitorScriptHelperService.postNewScript($scope.datasetName, $scope.description, kommonitorScriptHelperService.targetIndicator);					

					let scriptId = addScriptResponse.scriptId;
					$rootScope.$broadcast("refreshScriptOverviewTable", "add", scriptId);
					if(kommonitorScriptHelperService.scriptFormulaHTML_overwriteTargetIndicatorMethod){
						try {
							await kommonitorScriptHelperService.replaceMethodMetadataForTargetIndicator(kommonitorScriptHelperService.targetIndicator);
							kommonitorScriptHelperService.scriptFormulaHTML_successToastDisplay = kommonitorScriptHelperService.scriptFormulaHTML;
							$("#indicatorMetadataEditSuccessAlert").show();
						} catch (error) {
							if (error.data) {
								$scope.errorMessagePart_indicatorMetadata = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
							}
							else {
								$scope.errorMessagePart_indicatorMetadata = kommonitorDataExchangeService.syntaxHighlightJSON(error);
							}
		
							$("#indicatorMetadataEditErrorAlert").show();
							$scope.loadingData = false;
		
							setTimeout(() => {
								$scope.loadingData = false;
								$scope.$digest();
							}, 1000);
						}
						
					}				

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

					$("#scriptAddSuccessAlert").show();
					$scope.loadingData = false;

					setTimeout(() => {
						$scope.loadingData = false;
						$scope.$digest();
					}, 1000);
				} catch (error) {
					if (error.data) {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#scriptAddErrorAlert").show();
					$scope.loadingData = false;

					setTimeout(() => {
						$scope.loadingData = false;
						$scope.$digest();
					}, 1000);
				}

			};

			$scope.resetApplicableDates = function () {
				$scope.applicableDates = kommonitorScriptHelperService.targetIndicator.applicableDates;
				if(kommonitorScriptHelperService.processParameters.target_time) {
					kommonitorScriptHelperService.processParameters.target_time.value.excludeDates = [];
					kommonitorScriptHelperService.processParameters.target_time.value.includeDates = [];
				}
			}

			$scope.applicableDates = [];

			$scope.resetSelectableSpatialUnits = function () {
				$scope.selectableSpatialUnits = kommonitorDataExchangeService.availableSpatialUnits;
				kommonitorScriptHelperService.processParameters.target_spatial_units = [];
			}

			$scope.selectableSpatialUnits = [];

			$scope.onTargetIndicatorChanged = function (){
				kommonitorScriptHelperService.processParameters.target_indicator_id = kommonitorScriptHelperService.targetIndicator.indicatorId;
				$scope.resetApplicableDates();
				$scope.resetSelectableSpatialUnits();
			}

			$rootScope.$on("processDescriptionFetched", function (event) {

				// reduce "name" "value" pairs
				kommonitorScriptHelperService.scriptData.additional_parameters.parameters = kommonitorScriptHelperService.scriptData.additional_parameters.parameters.reduce((acc, param) => {
					acc[param.name] = param.value;
					return acc;
				}, {});

				kommonitorScriptHelperService.scriptData.additionalParameters = kommonitorScriptHelperService.scriptData.additional_parameters;
				kommonitorScriptHelperService.scriptData.additional_parameters = undefined;
				kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams = kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams[0];

				// save defaults for the inputs in processParameters
				kommonitorScriptHelperService.processParameters = Object.keys(kommonitorScriptHelperService.scriptData.inputs).reduce((acc, key) => {
					acc[key] = kommonitorScriptHelperService.scriptData.inputs[key].schema.default;
					return acc;
				}, {});

				setTimeout(() => {
					$scope.$digest();
				}, 1000);
			})

			$scope.hideSuccessAlert = function () {
				$("#scriptAddSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function () {
				$("#scriptAddErrorAlert").hide();
			};

			$scope.hideSuccessAlert_indicatorMetadata = function () {
				$("#indicatorMetadataEditSuccessAlert").hide();
			};

			$scope.hideErrorAlert_indicatorMetadata = function () {
				$("#indicatorMetadataEditErrorAlert").hide();
			};

			kommonitorMultiStepFormHelperService.registerClickHandler("scriptAddForm");

		}
	]
});
