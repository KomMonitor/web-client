angular.module('scriptTest').component('scriptTest', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/test/script-test.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function ScriptTestController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			//a
			$scope.pathToScriptResource = "./kommonitor-script-resources/km_indicator_absChange_nTemporalItems.js";

			//b
			$scope.tmpIndicatorSelection = undefined;

			//b
			$scope.compIndicatorSelection = undefined;
			$scope.compIndicatorSelection_old = undefined;

			$scope.inputData = {
				// COMPUTATION_ID : ....
				
			}

			//b
			$scope.parameterName_computationIndicator = "COMPUTATION_ID";
			$scope.parameterDescription_computationIndicator = "Indikatoren-ID des Basisindikators.";
			$scope.parameterDefaultValue_computationIndicator = undefined;
			$scope.parameterNumericMinValue_computationIndicator = 0;
			$scope.parameterNumericMaxValue_computationIndicator = 1;
			

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
				$scope.compIndicatorSelection = compIndicatorSelection;
				// remove previous refIndicator from requiredIndicators and add new one
				if($scope.compIndicatorSelection_old){
					kommonitorScriptHelperService.removeBaseIndicator($scope.compIndicatorSelection_old);
				}				
				kommonitorScriptHelperService.addBaseIndicator(compIndicatorSelection);

				$scope.compIndicatorSelection_old = compIndicatorSelection;

				$scope.inputData.computation_id = compIndicatorSelection.indicatorId;
				$scope.inputData.indicatorName = compIndicatorSelection.indicatorName;
				$scope.inputData.unit = compIndicatorSelection.unit;

				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();				

			};

			$scope.onChangeNumTemporalItems = function(){
				$scope.inputData.NUMBER_OF_TEMPORAL_ITEMS = Math.round($scope.inputData.NUMBER_OF_TEMPORAL_ITEMS);
				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeTemporalOption = function(){
				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeInputData = function(){
				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();	
			}

			//a
			$scope.resetScriptParameter = function(){
				kommonitorScriptHelperService.requiredScriptParameters_tmp = [];

				$scope.parameterDefaultValue_computationIndicator = undefined;

				if($scope.compIndicatorSelection && $scope.compIndicatorSelection.indicatorId){
					$scope.parameterDefaultValue_computationIndicator = $scope.compIndicatorSelection.indicatorId;
				}

				Object.keys(kommonitorScriptHelperService.scriptData.inputs).forEach(inputId => {
					let input = kommonitorScriptHelperService.scriptData.inputs[inputId];
					kommonitorScriptHelperService.addScriptParameter(input.title, input.description, input.schema.type, input.schema.default, input.schema.minimum, input.schema.maximum)
				});
			};

			//a
			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";

				if (! $scope.compIndicatorSelection){
					return;
				}

					var formulaHTML = "<b>Berechnung gem&auml;&szlig; Formel<br/> " + kommonitorScriptHelperService.scriptData.additionalParameters.parameters.formula;
					var dynamicLegendStr = kommonitorScriptHelperService.scriptData.additionalParameters.parameters.dynamicLegend;
					var legendValues = structuredClone($scope.inputData);

					// replace objects with displayName
					for (let key in legendValues) {
						if (legendValues.hasOwnProperty(key)) {
							if (typeof legendValues[key] === 'object' && 
								legendValues[key] !== null && 
								legendValues[key].hasOwnProperty('displayName')) {
								legendValues[key] = legendValues[key].displayName;
							}
						}
					}
					
					// parse with regEx to avoid 'eval' or similar unsecure methods
					function parseStringTemplate(str, obj) {
						let parts = str.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/);
						let args = str.match(/[^{\}]+(?=})/g) || [];
						let parameters = args.map(argument => obj[argument] || (obj[argument] === undefined ? "" : obj[argument]));
						return String.raw({ raw: parts }, ...parameters);
					}
					var legendText = parseStringTemplate(dynamicLegendStr, legendValues)

					kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + "<b>Legende zur Formel</b>" + legendText;
				
			};
	
		}
	]
});
