angular.module('scriptTest').component('scriptTest', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/test/script-test.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorCacheHelperService',
		function ScriptTestController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout, kommonitorCacheHelperService) {

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

			$scope.legendValues = {

			}

			//b
			$scope.parameterName_computationIndicator = "COMPUTATION_ID";
			$scope.parameterDescription_computationIndicator = "Indikatoren-ID des Basisindikators.";
			$scope.parameterDefaultValue_computationIndicator = undefined;
			$scope.parameterNumericMinValue_computationIndicator = 0;
			$scope.parameterNumericMaxValue_computationIndicator = 1;


			$scope.propertySchema = {};
			

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

				kommonitorScriptHelperService.processParameters.computation_id = compIndicatorSelection.indicatorId
				$scope.legendValues = Object.assign($scope.legendValues, compIndicatorSelection);

				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();				

			};

			$scope.onChangeNumTemporalItems = function(){
				kommonitorScriptHelperService.processParameters.number_of_temporal_items = Math.round(kommonitorScriptHelperService.processParameters.number_of_temporal_items);
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

			$scope.onChangeGeoresource = function(georesourceSelection){
				// remove previous refIndicator from requiredIndicators and add new one
				if($scope.georesourceSelection_old){
					kommonitorScriptHelperService.removeBaseGeoresource($scope.georesourceSelection_old);	
				}
				kommonitorScriptHelperService.addBaseGeoresource(georesourceSelection);

				$scope.georesourceSelection_old = georesourceSelection;

				//reset the one and only parameter in this case each time a base indicator is added
				//$scope.resetGeoresourceParameter();
				$scope.parameterDefaultValue_computationGeoresource = georesourceSelection.georesourceId;
				$scope.resetPropertyOptions();
				$scope.resetComputationFormulaAndLegend();				
			};

			$scope.onChangePropertyName = function(propertyName){
				$scope.resetScriptParameter_filterPropertyName(propertyName);
				$scope.resetComputationFormulaAndLegend();
				$scope.filterOperatorOptions();
				$scope.resetPropertyValueOptions();
				if ($scope.parameterDefaultValue_computationFilterOperator === 'Contains') {
					$scope.propertyValueSelection = [];
				}
			};

			$scope.onChangeOperatorOption = function(operatorOption){
				if ($scope.parameterDefaultValue_computationFilterOperator !== 'Contains') {
					$scope.propertyValueSelection = [];
				}
				$scope.resetScriptParameter_operator(operatorOption);
				$scope.resetComputationFormulaAndLegend();
			};

			$scope.onChangePropertyValue = function(){
				$scope.resetScriptParameter_filterPropertyValue();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.resetScriptParameter_computationGeoresource = function(georesourceMetadata){

				return georesourceMetadata.georesourceId;
			};

			$scope.resetGeoresourceParameter = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationGeoresource);
				$scope.parameterDefaultValue_computationGeoresource = $scope.georesourceSelection.georesourceId;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationGeoresource, $scope.parameterDescription_computationGeoresource, $scope.parameterDataType, $scope.parameterDefaultValue_computationGeoresource, $scope.parameterNumericMinValue_computationGeoresource, $scope.parameterNumericMaxValue_computationGeoresource);
			};

			$scope.resetPropertyOptions = function(){
				kommonitorCacheHelperService.fetchSingleGeoresourceSchema($scope.parameterDefaultValue_computationGeoresource)
				.then((schema) => {
					console.log(schema);
					for (var prop in schema) {
						if (schema[prop] !== 'Date') {
							$scope.propertySchema[prop] = schema[prop];
						}
					}
					$scope.propertyOptions = Object.keys($scope.propertySchema);
				});
			};

			$scope.resetScriptParameter_filterPropertyName = function(propertyName){
				kommonitorScriptHelperService.removeScriptParameter_byName(propertyName);
				$scope.parameterDefaultValue_computationFilterProperty = propertyName;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterProperty, $scope.parameterDescription_computationFilterProperty, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterProperty, $scope.parameterNumericMinValue_computationFilterProperty, $scope.parameterNumericMaxValue_computationFilterProperty);
			};

			$scope.filterOperatorOptions = function(){
				if ($scope.propertySchema[$scope.parameterDefaultValue_computationFilterProperty] === "String"){
					$scope.operatorOptions = [
						{
							"apiName": "Equal",
							"displayName": "gleich (=)",
						},
						{
							"apiName": "Unequal",
							"displayName": "ungleich (!=)",
						},
						{
							"apiName": "Contains",
							"displayName": "enthält (kommaseparierte Liste)",
						}
					];
				} else {
					$scope.operatorOptions = [
						{
							"apiName": "Equal",
							"displayName": "gleich (=)",
						},
						{
							"apiName": "Greater_than",
							"displayName": "größer als (>)",
						},
						{
							"apiName": "Greater_than_or_equal",
							"displayName": "größer als oder gleich (>=)",
						},
						{
							"apiName": "Less_than",
							"displayName": "kleiner als (<)",
						},
						{
							"apiName": "Less_than_or_equal",
							"displayName": "kleiner als oder gleich (<=)",
						},
						{
							"apiName": "Unequal",
							"displayName": "ungleich (!=)",
						},
						{
							"apiName": "Range",
							"displayName": "Wertebereich (>=untere Grenze & <obere Grenze)",
						}];
				}
			};

			$scope.resetScriptParameter_operator = function(operatorOption){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterOperator);
				if (operatorOption !== null) {
					$scope.parameterDefaultValue_computationFilterOperator = operatorOption;
				}				
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterOperator, $scope.parameterDescription_computationFilterOperator, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterOperator, $scope.parameterNumericMinValue_computationFilterOperator, $scope.parameterNumericMaxValue_computationFilterOperator);
			};

			$scope.resetPropertyValueOptions = function(){
				kommonitorCacheHelperService.fetchSingleGeoresourceWithoutGeometry($scope.parameterDefaultValue_computationGeoresource)
				.then((dataTable) => {
					var data = dataTable;
					var tmpArray = data.map(item => {
						let value = item[$scope.parameterDefaultValue_computationFilterProperty];
						return value;
					});
					if ($scope.propertySchema[$scope.parameterDefaultValue_computationFilterProperty] === "String" || $scope.propertySchema[$scope.parameterDefaultValue_computationFilterProperty] === "Boolean") {
						// sort strings
						$scope.propertyValueOptions = Array.from(new Set(tmpArray)).sort();
					} else {
						// sort numbers
						$scope.propertyValueOptions = Array.from(new Set(tmpArray)).sort(function(a,b){
							return a - b;
						});
					}
				});
			};

			$scope.filterPropertyValueRange_toOptions = function() {
				return function(item) {
					if (item > $scope.propertyValueRange_from) {
						return true;
					}
					return false;
				};
			};

			$scope.resetScriptParameter_filterPropertyValue = function() {
					kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterPropertyValue);
					if ($scope.parameterDefaultValue_computationFilterOperator !== "Contains") {
						$scope.parameterDefaultValue_computationFilterPropertyValue = $scope.propertyValue;
					} else {
						$scope.parameterDefaultValue_computationFilterPropertyValue = $scope.propertyValueSelection.join();
					}
					kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterPropertyValue, $scope.parameterDescription_computationFilterPropertyValue, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterPropertyValue, $scope.parameterNumericMinValue_computationFilterPropertyValue, $scope.parameterNumericMaxValue_computationFilterPropertyValue);
			};


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

					var formulaHTML = "<b>Berechnung gem&auml;&szlig; Formel<br/> " + kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams.formula;
					var dynamicLegendStr = kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams.dynamicLegend;
					$scope.legendValues =  Object.assign($scope.legendValues, kommonitorScriptHelperService.processParameters);

					// replace objects with displayName
					for (let key in $scope.legendValues) {
						if ($scope.legendValues.hasOwnProperty(key)) {
							if (typeof $scope.legendValues[key] === 'object' && 
								$scope.legendValues[key] !== null && 
								$scope.legendValues[key].hasOwnProperty('displayName')) {
								$scope.legendValues[key] = $scope.legendValues[key].displayName;
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
					var legendText = parseStringTemplate(dynamicLegendStr, $scope.legendValues)

					kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + "<b>Legende zur Formel</b>" + legendText;
				
			};
	
		}
	]
});
