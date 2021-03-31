angular.module('scriptContinuity').component('scriptContinuity', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/continuity/script-continuity.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function ScriptContinuityController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.pathToScriptResource = "./kommonitor-script-resources/km_indicator_continuity_nTemporalItems.js";

			$scope.tmpIndicatorSelection = undefined;

			$scope.compIndicatorSelection = undefined;
			$scope.compIndicatorSelection_old = undefined;

			$scope.parameterName_computationIndicator = "COMPUTATION_ID";
			$scope.parameterDescription_computationIndicator = "Indikatoren-ID des Basisindikators.";
			$scope.parameterDefaultValue_computationIndicator = undefined;
			$scope.parameterNumericMinValue_computationIndicator = 0;
			$scope.parameterNumericMaxValue_computationIndicator = 1;

			$scope.temporalOption = kommonitorScriptHelperService.temporalOptions[0];	
			
			$scope.numberOfTemporalItems = 3;

			$scope.parameterName_temporalOption = "TEMPORAL_TYPE";
			$scope.parameterDescription_temporalOption = "Angabe des Zeitbezug-Typs. Standard ist 'Jahre'.";
			$scope.parameterDefaultValue_temporalOption = "YEARS";
			$scope.parameterNumericMinValue_temporalOption = 0;
			$scope.parameterNumericMaxValue_temporalOption = 1;

			$scope.parameterName_numTemporalItems = "NUMBER_OF_TEMPORAL_ITEMS";
			$scope.parameterDescription_numTemporalItems = "Anzahl der Zeiteinheiten. Standard ist '3'.";
			$scope.parameterDefaultValue_numTemporalItems = 3;
			$scope.parameterNumericMinValue_numTemporalItems = 3;
			$scope.parameterNumericMaxValue_numTemporalItems = 100000;
			$scope.parameterDataType_numTemporalItems = kommonitorScriptHelperService.availableScriptDataTypes[3];

			/*
				availableScriptDataTypes = [
					{
								"displayName": "Textuell (String)",
								"apiName": "string"
							},
							{
								"displayName": "Wahrheitswert (Boolean)",
								"apiName": "boolean"
					},
					{
								"displayName": "Ganzzahl (Integer)",
								"apiName": "integer"
							},
							{
								"displayName": "Gleitkommazahl (Double)",
								"apiName": "double"
							}
				];
			*/
			$scope.parameterDataType = kommonitorScriptHelperService.availableScriptDataTypes[0];

			$scope.scriptCode_readableString_forPreview = undefined;
			$scope.scriptCodeDomElementId = "#scriptCodePreview";

			$scope.scriptFormulaHTML = undefined;

			/*
			* reset relevant things due to change of script type
			*/
			$scope.init = function(){
				kommonitorScriptHelperService.reset();

				$scope.initFixedScriptCode();
			};

			$scope.initFixedScriptCode = function(){
				$http.get($scope.pathToScriptResource, {'responseType': 'text'}).then(function (response) {
					$scope.scriptCode_readableString_forPreview = response.data;
						kommonitorScriptHelperService.scriptCode_readableString = response.data;
						$scope.scriptCode_readableString_forPreview = response.data;

						kommonitorScriptHelperService.prettifyScriptCodePreview($scope.scriptCodeDomElementId);
				  });
			};

			$scope.init();

			$scope.onChangeComputationIndicator = function(compIndicatorSelection){
				// remove previous refIndicator from requiredIndicators and add new one
				if($scope.compIndicatorSelection_old){
					kommonitorScriptHelperService.removeBaseIndicator($scope.compIndicatorSelection_old);
				}				
				kommonitorScriptHelperService.addBaseIndicator(compIndicatorSelection);

				$scope.compIndicatorSelection_old = compIndicatorSelection;

				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();				

			};

			$scope.onChangeNumTemporalItems = function(){
				$scope.numberOfTemporalItems = Math.round($scope.numberOfTemporalItems);
				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeTemporalOption = function(){
				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.resetScriptParameter = function(){
				kommonitorScriptHelperService.requiredScriptParameters_tmp = [];

				$scope.parameterDefaultValue_computationIndicator = undefined;

				if($scope.compIndicatorSelection && $scope.compIndicatorSelection.indicatorId){
					$scope.parameterDefaultValue_computationIndicator = $scope.compIndicatorSelection.indicatorId;
				}

				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationIndicator, $scope.parameterDescription_computationIndicator, $scope.parameterDataType, $scope.parameterDefaultValue_computationIndicator, $scope.parameterNumericMinValue_computationIndicator, $scope.parameterNumericMaxValue_computationIndicator);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_numTemporalItems, $scope.parameterDescription_numTemporalItems, $scope.parameterDataType_numTemporalItems, $scope.numberOfTemporalItems, $scope.parameterNumericMinValue_numTemporalItems, $scope.parameterNumericMaxValue_numTemporalItems);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_temporalOption, $scope.parameterDescription_temporalOption, $scope.parameterDataType, $scope.temporalOption.apiName, $scope.parameterNumericMinValue_temporalOption, $scope.parameterNumericMaxValue_temporalOption);
			};

			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";

				if (! $scope.compIndicatorSelection){
					return;
				}

					var formulaHTML = "<b>Berechnung gem&auml;&szlig; Formel<br/> $$ r = \\frac{\\sum_{n=1}^{m}((A_{n} - \\bar{A}) \\times (B_{n} - \\bar{B}))}{\\sqrt{\\sum_{n=1}^{m} (A_{n} - \\bar{A})^2 \\times \\sum_{n=1}^{m} (B_{n} - \\bar{B})^2}} $$";
					var legendItemsHTML = "<b>Legende zur Formel</b>";				
			
					legendItemsHTML+="<br/> $r$: Kontinuit&auml;t (Korrelationskoeffizient nach Pearson bei linearer Regression &uuml;ber die betrachtete Zeitspanne)";
					legendItemsHTML+="<br/> $m$ = " + $scope.numberOfTemporalItems + " konsekutive vergangene " + $scope.temporalOption.displayName;
					legendItemsHTML+="<br/> $A_{n}$ = aufeinander folgende " + $scope.temporalOption.displayName;
					legendItemsHTML+="<br/> $\\bar{A}$ = arithmetisches Mittel der aufeinander folgenden " + $scope.temporalOption.displayName;
					legendItemsHTML+="<br/> $B_{n}$ = Indikatorenwerte der aufeinander folgenden " + $scope.temporalOption.displayName;
					legendItemsHTML+="<br/> $\\bar{B}$ = arithmetisches Mittel der Indikatorenwerte der aufeinander folgenden " + $scope.temporalOption.displayName;
					legendItemsHTML+="<br/> $B$ = Indikator '" + $scope.compIndicatorSelection.indicatorName +  " [" + $scope.compIndicatorSelection.unit +  "]'";

					kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
				
			};
	
		}
	]
});
