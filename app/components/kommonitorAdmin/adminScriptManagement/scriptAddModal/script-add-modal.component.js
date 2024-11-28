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

			kommonitorScriptHelperService.scriptData = {
				"id": "changeAbsolute",
				"version": "1.0.0",
				"title": "Absolute Veränderung bezogen auf Zeitspanne",
				"description": "Berechnet die prozentuale Ver&auml;nderung zwischen zwei Zeitpunkten eines Indikators.",
				"additionalParameters": {
					"parameters": [
						{
							"name": "formula",
							"value": "$ I_{N} - I_{M} $"
						},
						{
							"name": "legend",
							"value": "<br/>$N$ = Ziel-Zeitpunkt<br/>$M$ = fester Referenz-Zeitpunkt<script>alert('hack')</script>"
						}
					]
				},
				"inputs": {
					"computation_id": {
						"title": "COMPUTATION_ID",
						"description": "Indikatoren-ID des Basisindikators.",
						"additionalParameters": {
							"parameters": [
								{
									"name": "input_group",
									"value": "computation_id"
								}
							]
						},
						"schema": { 
							"type": "string",
							"default": "72b9b6ec-f4e0-4d58-a1b4-c49045532403"
						}
					},
					"number_of_temporal_items": {
						"title": "NUMBER_OF_TEMPORAL_ITEMS",
						"description": "Anzahl der Zeiteinheiten. Standard ist '1'.",
						"additionalParameters": {
							"parameters": [
								{
									"name": "input_group",
									"value": "temporal_options"
								}
							]
						},
						"schema": { 
							"type": "integer", 
							"minimum": 1, 
							"maximum": 100000,
							"default": 1
						}
					},
					"temporal_type": {
						"title": "TEMPORAL_TYPE",
						"description": "Angabe des Zeitbezug-Typs. Standard ist 'Jahre'.",
						"additionalParameters": {
							"parameters": [
								{
									"name": "input_group",
									"value": "temporal_options"
								}
							]
						},
						"schema": { 
							"type": "string", 
							"enum": ["DAYS", "MONTHS", "YEARS"],
							"default": "YEARS"
						}
					}
				},
				"outputs": {
					// ...
				},
				"jobControlOptions": [],
				"outputTransmission": []
			}


			kommonitorScriptHelperService.scriptData.additionalParameters.parameters = kommonitorScriptHelperService.scriptData.additionalParameters.parameters.reduce((acc, param) => {
				acc[param.name] = param.value;
				return acc;
			}, {});

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
