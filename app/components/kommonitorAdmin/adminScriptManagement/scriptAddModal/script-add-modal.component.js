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

			$scope.selectedScriptType = {};

			kommonitorScriptHelperService.availableScriptTypes = [
        {
					"displayName": "(neu) Indikatoren - Veränderung absolut",
					"apiName": "indicator_change_absolute_new"
        },
        {
					"displayName": "(neu) Georessourcen - Anzahl Punkte in Polygon",
					"apiName": "georesource_pointsInPolygon_new"
				},
				{
					"displayName": "(neu) Indikatoren - Prozentualer Anteil (Quotient zwischen Basis-Indikatoren und einem Referenzindikator)",
					"apiName": "percentage_new"
				},
				{
					"displayName": "(neu) Indikatoren - Produkt aller Indikatoren",
					"apiName": "multiplication_new"
				}      
			];

			kommonitorScriptHelperService.availableScriptTypeOptions.push(...kommonitorScriptHelperService.availableScriptTypes);

			kommonitorScriptHelperService.scriptData = {}

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

				// ToDo: make API call

				if($scope.selectedScriptType.apiName.includes("old")){
					return;
				}

				if ($scope.selectedScriptType.apiName == "indicator_change_absolute_new") {
					kommonitorScriptHelperService.scriptData = {
						"id": "changeAbsolute",
						"version": "1.0.0",
						"title": "[dynamisch erzeugt]Absolute Veränderung bezogen auf Zeitspanne",
						"description": "Berechnet die absolute Veränderung zwischen zwei Zeitpunkten eines Indikators.",
						"additionalParameters": {
							"parameters": [
								{
									"name": "kommonitorUiParams",
									"value": {
										"titleShort": "Veränderung absolut",
										"apiName": "indicator_change_absolute",
										"formula": "$ I_{N} - I_{M} $",
										"legend": "<br/>$N$ = Ziel-Zeitpunkt<br/>$M$ = Ziel-Zeitpunkt minus Anzahl Tage/Monate/Jahre ",
										"dynamicLegend": "<br/> $A$: ${indicatorName} [ ${unit} ]<br/> $N$: Ziel-Zeitpunkt<br/> $M$: Ziel-Zeitpunkt minus ${number_of_temporal_items} ${temporal_type}",
										"inputBoxes": [
											{
												"id": "computation_id",
												"title": "Notwendiger Basis-Indikator",
												"description": "",
												"contents": [
													"computation_id"
												]
											},
											{
												"id": "temporal_options",
												"title": "Notwendiger zeitlicher Bezug",
												"description": "",
												"contents": [
													"number_of_temporal_items",
													"temporal_type"
												]
											}
										]
									}
								}
							]
						},
						"inputs": {
							"target_indicator_id": {
								"schema": { 
									"type": "string",
									"default": null
								}
							},
							"target_spatial_units": {
								"schema": { 
									"type": "array",
									"default": []
								}
							},
							"target_time": {
								"schema": { 
									"type": "object",
									"default": {
										"value":{
											"mode": "MISSING",
											"includeDates" : [],
											"excludeDates" : []
										}
									}
								}
							},
							"execution_interval": {
								"schema": { 
									"type": "object",
									"default": {
										"value": {
											"cron": "0 0 1 * *"
										}
									}
								}
							},
							"computation_id": {
								"title": "Auswahl des für die Berechnung erforderlichen Basis-Indikators",
								"description": "Indikatoren-ID des Basisindikators.",
								"schema": { 
									"type": "string",
									"default": null
								}
							},
							"number_of_temporal_items": {
								"title": "Anzahl",
								"description": "Anzahl der Zeiteinheiten. Standard ist '1'.",
								"schema": { 
									"type": "integer", 
									"minimum": 1, 
									"maximum": 100000,
									"default": 1
								}
							},
							"temporal_type": {
								"title": "Art des zeitlichen Bezugs",
								"description": "Angabe des Zeitbezug-Typs. Standard ist 'Jahre'.",
								"schema": { 
									"type": "string", 
									"enum": [
										{
											"apiName": "YEARS",
											"displayName": "Jahr(e)"
										},
										{
											"apiName": "MONTHS",
											"displayName": "Monat(e)"
										},
										{
											"apiName": "DAYS",
											"displayName": "Tag(e)"
										}
									],
									"default": {
										"apiName": "YEARS",
										"displayName": "Jahr(e)"
									}
								}
							}
						},
						"outputs": {
						},
						"jobControlOptions": [],
						"outputTransmission": []
					}
				}
				if ($scope.selectedScriptType.apiName == "georesource_pointsInPolygon_new") {
					kommonitorScriptHelperService.scriptData ={
						"id": "pointsInPolygon",
						"version": "1.0.0",
						"title": "[dynamisch erzeugt] Anzahl Punktobjekte pro Gebietskörperschaft",
						"description": "Auswahl einer punktbasierten Georessource, für die eine Punkt-in-Polygon Analyse durchgeführt wird, um die Anzahl der Punkte pro Raumeinheits-Feature zu erhalten. Optional können die Punktdaten anhand einer Objekteigenschaft sowie einem Filterwert dieser Objekteigenschaft gefiltert werden (z. B. Objekteigenschaft: Schulform, Filterwert: Grundschule, Operatoren: gleich/ungleich/enthält). Für numerische Werte lassen sich zudem Wertebereiche spezifizieren (z. B. Objekteigenschaft: Anzahl, Filterwert: 50, Operatoren: <, <=, =, >, >=, !=, Wertebereich)",
						"additionalParameters": {
							"parameters": [
								{
									"name": "kommonitorUiParams",
									"value": {
										"titleShort": "Anzahl Punkte in Polygon",
										"apiName": "georesource_pointsInPolygon",
										"dynamicLegend": "<br/> $A$: ${indicatorName} [ ${unit} ]<br/> $N$: Ziel-Zeitpunkt<br/> $M$: Ziel-Zeitpunkt minus ${number_of_temporal_items} ${temporal_type}",
										"calculation_info": "Summe aller Punkte innerhalb jedes Raumeinheits-Features.",
										"optional_info": "Anwenden eines Filters anhand einer Objekteigenschaft",
										"inputBoxes": [
											{
												"id": "georesource_id",
												"title": "Benötigte punktbasierte Georessource",
												"description": "",
												"contents": [
													"georesource_id"
												]
											},
											{
												"id": "comp_filter",
												"title": "Filter durch eine Objekteigenschaft (Optional)",
												"description": "",
												"contents": [
													"comp_filter"
												]
											}
										]
									}
								}
							]
						},
						"inputs": {
							"target_indicator_id": {
								"schema": { 
									"type": "string",
									"default": null
								}
							},
							"target_spatial_units": {
								"schema": { 
									"type": "array",
									"default": []
								}
							},
							"target_time": {
								"schema": { 
									"type": "object",
									"default": {
										"value":{
											"mode": "MISSING",
											"includeDates" : [],
											"excludeDates" : []
										}
									}
								}
							},
							"execution_interval": {
								"schema": { 
									"type": "object",
									"default": {
										"value": {
											"cron": "0 0 1 * *"
										}
									}
								}
							},
							"georesource_id": {
								"title": "Auswahl des für die Berechnung erforderlichen Basis-Indikators",
								"description": "Georessourcen ID des Punktdatensatzes.",
								"schema": { 
									"type": "string",
									"default": "4b68105a-bdf5-4c88-a86b-091ce8aeaf2a"
								}
							},
							"comp_filter": {
								"title": "Filter durch eine Objekteigenschaft",
								"description": "",
								"schema": { 
									"type": "object",
									"default": {
										"value": {
											"compFilterProp": null,
											"compFilterOperator" : null,
											"compFilterPropVal" : null
										}
									}
								}
							}
						},
						"outputs": {
						},
						"jobControlOptions": [],
						"outputTransmission": []
					}
				}
				if ($scope.selectedScriptType.apiName == "percentage_new") {
					kommonitorScriptHelperService.scriptData = {
						
							"id": "percentage",
							"version": "1.0.0",
							"title": "Prozentualer Anteil mehrerer Basisindikatoren von einem Referenzindikator",
							"description": "Mindestens ein (Basis-)Indikator muss angegeben werden. Bei mehreren wird die Gesamtsumme der (Basis-)Indikatoren durch den Wert des Referenzindikators dividiert",
							"additionalParameters": {
								"parameters": [
									{
										"name": "kommonitorUiParams",
										"value": {
											"titleShort": "",
											"apiName": "percentage",
											"calculation_info": "Quotient zwischen (Basis-)Indikatoren und dem Referenzindikator multipliziert mit 100",
											"formula": "$$ \\frac{\\sum_{n=1}^{m} I_{n}}{I_{ref}} \\times 100 $$",
											"dynamicFormula": "$$ \\frac{ sum_baseIndicators }{ I_{ref}} \\times 100 $$",
											"dynamicLegend": "${list_baseIndicators} <br/>$ I_{ref} $: ${indicatorName} [ ${unit} ]<br/>",
											"inputBoxes": [
												{
													"id": "reference_id",
													"title": "Notwendiger Referenzindikator (Divisor)",
													"description": "",
													"contents": [
														"reference_id"
													]
												},
												{
													"id": "computation_ids",
													"title": "Notwendige (Basis-)Indikatoren (Dividend)",
													"description": "",
													"contents": [
														"computation_ids"
													]
												}
											]
										}
									}
								]
							},
							"inputs": {
								"target_indicator_id": {
									"schema": { 
										"type": "string",
										"default": null
									}
								},
								"target_spatial_units": {
									"schema": { 
										"type": "array",
										"default": []
									}
								},
								"target_time": {
									"schema": { 
										"type": "object",
										"default": {
											"value":{
												"mode": "MISSING",
												"includeDates" : [],
												"excludeDates" : []
											}
										}
									}
								},
								"execution_interval": {
									"schema": { 
										"type": "object",
										"default": {
											"value": {
												"cron": "0 0 1 * *"
											}
										}
									}
								},
								"computation_ids": {
									"schema": { 
										"type": "array",
										"default": []
									}
								},
								"reference_id": {
									"schema": { 
										"type": "string",
										"default": null
									}
								}
							},
							"outputs": {
							},
							"jobControlOptions": [],
							"outputTransmission": []
						
					}
				}
				if ($scope.selectedScriptType.apiName == "multiplication_new") {
					kommonitorScriptHelperService.scriptData = {		
						"id": "multiplication",
						"version": "1.0.0",
						"title": "Produkt mehrerer Basisindikatoren",
						"description": "Mindestens zwei (Basis-)Indikator müssen angegeben werden, aus dem sich der Ziel-Indikator ableitet. Beliebig viele sind m&ouml;glich.",
						"additionalParameters": {
							"parameters": [
								{
									"name": "kommonitorUiParams",
									"value": {
										"titleShort": "",
										"apiName": "indicator_multiplication",
										"calculation_info": "Produkt aller (Basis-)Indikatoren",
										"formula": "$ \\prod_{n=1}^{m} I_{n} $",
										"legend": "",
										"dynamicFormula": "$$ prod_baseIndicators $$",
										"dynamicLegend": "${list_baseIndicators}",
										"inputBoxes": [
											{
												"id": "computation_ids",
												"title": "Notwendige (Basis-)Indikatoren (Faktoren)",
												"description": "",
												"contents": [
													"computation_ids"
												]
											}
										]
									}
								}
							]
						},
						"inputs": {
							"target_indicator_id": {
								"schema": { 
									"type": "string",
									"default": null
								}
							},
							"target_spatial_units": {
								"schema": { 
									"type": "array",
									"default": []
								}
							},
							"target_time": {
								"schema": { 
									"type": "object",
									"default": {
										"value":{
											"mode": "MISSING",
											"includeDates" : [],
											"excludeDates" : []
										}
									}
								}
							},
							"execution_interval": {
								"schema": { 
									"type": "object",
									"default": {
										"value": {
											"cron": "0 0 1 * *"
										}
									}
								}
							},
							"computation_ids": {
								"schema": { 
									"type": "array",
									"default": []
								}
							}
						},
						"outputs": {
						},
						"jobControlOptions": [],
						"outputTransmission": []
					}
				}

				// reduce "name" "value" pairs
				kommonitorScriptHelperService.scriptData.additionalParameters.parameters = kommonitorScriptHelperService.scriptData.additionalParameters.parameters.reduce((acc, param) => {
					acc[param.name] = param.value;
					return acc;
				}, {});

				// save defaults for the inputs in processParameters
				kommonitorScriptHelperService.processParameters = Object.keys(kommonitorScriptHelperService.scriptData.inputs).reduce((acc, key) => {
					acc[key] = kommonitorScriptHelperService.scriptData.inputs[key].schema.default;
					return acc;
				}, {});
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
