angular.module('scriptTest').component('scriptTest', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/test/script-test.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorCacheHelperService',
		function ScriptTestController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout, kommonitorCacheHelperService) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.tmpIndicatorSelection = undefined;

			$scope.compIndicatorSelection = undefined;

			$scope.baseIndicators = [];

			$scope.inputData = {}
			$scope.legendValues = {};

			$scope.compFilterData = {
				operator: null,
				operatorOptions: null,
				propertySchema: {},
				propertyOptions: [],
				propertyName: null,
				propertyValueOptions: null,
				propertyValue: null,
			};

			$scope.numericPropertyOptions = undefined;

			$scope.compPropSelection = {
				numericPropertyName: null
			};

			$scope.refDateSelection = {
				referenceDate: null
			};

			$scope.dropdownTranslations =  kommonitorDataExchangeService.multiselectDropdownTranslations;
			$scope.dropdownSettings = kommonitorDataExchangeService.multiselectDropdownSettings;
			$scope.dropdownEvents =  {
				onSelectionChanged: function() {
					$scope.onChangePropertyValue();
				}
			};

			/*
			* reset relevant things due to change of script type
			*/
			$scope.init = function(){
				kommonitorScriptHelperService.reset();
			};

			$scope.init();

			$scope.onChangeReferenceIndicator = function(refIndicatorSelection, inputBox){
				$scope.refIndicatorSelection = refIndicatorSelection;

				if(inputBox && inputBox.processInputName){
					kommonitorScriptHelperService.processParameters[inputBox.processInputName] = refIndicatorSelection.indicatorId;
				}
				else{
					kommonitorScriptHelperService.processParameters.reference_id = refIndicatorSelection.indicatorId;
				}				
				$scope.legendValues.refIndicatorSelection = refIndicatorSelection;

				$scope.resetComputationFormulaAndLegend();				
			};

			$scope.onChangeReferenceDate = function(){
				kommonitorScriptHelperService.processParameters.reference_date = $scope.refDateSelection.referenceDate;
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeComputationIndicator = function(compIndicatorSelection, inputBox){
				$scope.compIndicatorSelection = compIndicatorSelection;

				if(inputBox && inputBox.processInputName){
					kommonitorScriptHelperService.processParameters[inputBox.processInputName] = compIndicatorSelection.indicatorId;
				}
				else{
					kommonitorScriptHelperService.processParameters.computation_id = compIndicatorSelection.indicatorId;
				}		
				$scope.legendValues.compIndicatorSelection = compIndicatorSelection;

				$scope.resetComputationFormulaAndLegend();				
			};

			$scope.addBaseIndicator = function(tmpIndicatorSelection){

				$scope.baseIndicators.push(tmpIndicatorSelection);
				if(!kommonitorScriptHelperService.processParameters.computation_ids) {
					kommonitorScriptHelperService.processParameters.computation_ids = [];
				}
				kommonitorScriptHelperService.processParameters.computation_ids.push(tmpIndicatorSelection.indicatorId);
				$scope.resetComputationFormulaAndLegend();

				setTimeout(() => {
					$scope.$digest();
				});
			};

			$scope.removeBaseIndicator = function(baseIndicator){
				var i;
				for (let index = 0; index < $scope.baseIndicators.length; index++) {
					const element = $scope.baseIndicators[index];
					
					if(baseIndicator.indicatorId == element.indicatorId){
						i = index;
						break;
					}
				}
				$scope.baseIndicators.splice(i, 1);
				kommonitorScriptHelperService.processParameters.computation_ids.splice(i, 1);

				$scope.resetComputationFormulaAndLegend();
				
				setTimeout(() => {
					$scope.$digest();
				});
			};

			$scope.onChangeNumTemporalItems = function(){
				kommonitorScriptHelperService.processParameters.number_of_temporal_items = Math.round(kommonitorScriptHelperService.processParameters.number_of_temporal_items);
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeTemporalOption = function(){
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeInputData = function(){
				$scope.resetComputationFormulaAndLegend();	
			}

			$scope.onChangeGeoresource = function(georesourceSelection, inputBox){
				if(inputBox && inputBox.processInputName){
					kommonitorScriptHelperService.processParameters[inputBox.processInputName] = georesourceSelection.georesourceId;
				}
				else{
					kommonitorScriptHelperService.processParameters.georesource_id = georesourceSelection.georesourceId;
				}	
				$scope.georesourceSelection = georesourceSelection;
				$scope.legendValues.georesourceSelection = georesourceSelection;

				$scope.compFilterData = {
					operator: null,
					operatorOptions: null,
					propertySchema: {},
					propertyOptions: [],
					propertyName: null,
					propertyValueOptions: null,
					propertyValue: null,
				}

				$scope.resetPropertyOptions();
				$scope.resetNumericPropertyOptions();
				$scope.resetComputationFormulaAndLegend();				
			};

			$scope.resetNumericPropertyOptions = function(){
				$scope.propertySchema = {};
				kommonitorCacheHelperService.fetchSingleGeoresourceSchema(kommonitorScriptHelperService.processParameters.georesource_id)
				.then((schema) => {
					for (var prop in schema) {
						if (schema[prop] === 'Integer' || schema[prop] === 'Double') {
							$scope.propertySchema[prop] = schema[prop];
						}
					}
					$scope.numericPropertyOptions = Object.keys($scope.propertySchema);
				});
			};

			$scope.onChangeNumericPropertyName = function(){
				kommonitorScriptHelperService.processParameters.compProp = $scope.compPropSelection.numericPropertyName;
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangePropertyName = function(propertyName){
				kommonitorScriptHelperService.processParameters.comp_filter.compFilterProp = $scope.compFilterData.propertyName;
				$scope.resetComputationFormulaAndLegend();
				$scope.filterOperatorOptions();
				$scope.resetPropertyValueOptions();
				if ($scope.compFilterData.operator && $scope.compFilterData.operator.apiName === 'Contains') {
					$scope.compFilterData.propertyValueSelection = [];
				}
			};

			$scope.onChangeOperatorOption = function(operatorOption){
				if ($scope.compFilterData.operator) {
					kommonitorScriptHelperService.processParameters.comp_filter.compFilterOperator = $scope.compFilterData.operator.apiName;
					if ($scope.compFilterData.operator.apiName === 'Contains') {
						$scope.compFilterData.propertyValueSelection = [];
					}
				}
				$scope.resetComputationFormulaAndLegend();
			};

			$scope.onChangePropertyValue = function(){
				kommonitorScriptHelperService.processParameters.comp_filter.compFilterPropVal = $scope.compFilterData.propertyValue;
				$scope.resetScriptParameter_filterPropertyValue();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.resetPropertyOptions = function(){
				kommonitorCacheHelperService.fetchSingleGeoresourceSchema(kommonitorScriptHelperService.processParameters.georesource_id)
				.then((schema) => {
					for (var prop in schema) {
						if (schema[prop] !== 'Date') {
							$scope.compFilterData.propertySchema[prop] = schema[prop];
						}
					}
					$scope.compFilterData.propertyOptions = Object.keys($scope.compFilterData.propertySchema);
				});
			};

			$scope.filterOperatorOptions = function(){
				if ($scope.compFilterData.propertySchema[$scope.compFilterData.propertyName] === "String"){
					$scope.compFilterData.operatorOptions = [
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
					$scope.compFilterData.operatorOptions = [
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

			$scope.resetPropertyValueOptions = function(){
				kommonitorCacheHelperService.fetchSingleGeoresourceWithoutGeometry(kommonitorScriptHelperService.processParameters.georesource_id)
				.then((dataTable) => {
					var data = dataTable;
					var tmpArray = data.map(item => {
						let value = item[$scope.compFilterData.propertyName];
						return value;
					});
					if ($scope.compFilterData.propertySchema[$scope.compFilterData.propertyName] === "String" || $scope.compFilterData.propertySchema[$scope.compFilterData.propertyName] === "Boolean") {
						// sort strings
						$scope.compFilterData.propertyValueOptions = Array.from(new Set(tmpArray)).sort();
					} else {
						// sort numbers
						$scope.compFilterData.propertyValueOptions = Array.from(new Set(tmpArray)).sort(function(a,b){
							return a - b;
						});
					}
				});
			};

			$scope.filterPropertyValueRange_toOptions = function() {
				return function(item) {
					if (item > $scope.compFilterData.propertyValueRange_from) {
						return true;
					}
					return false;
				};
			};

			$scope.resetScriptParameter_filterPropertyValue = function() {
				if($scope.compFilterData.operator) {
					if ($scope.compFilterData.operator.apiName !== "Contains") {
						kommonitorScriptHelperService.processParameters.comp_filter.compFilterPropVal = $scope.compFilterData.propertyValue;
					} else {
						kommonitorScriptHelperService.processParameters.comp_filter.compFilterPropVal = $scope.compFilterData.propertyValueSelection.join();
					}
				}
			};

			$scope.onChangePropertyValueRange_range = function() {
				$scope.compFilterData.propertyValue = $scope.compFilterData.propertyValueRange_from + "-" + $scope.compFilterData.propertyValueRange_to;
				$scope.resetScriptParameter_filterPropertyValue();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.createDynamicFormula = function(formula) {
				if(formula.includes('sum_baseIndicators')) {
					baseIndicators_formula = "";
					baseIndicators_legend = "";
					for (let index = 0; index < $scope.baseIndicators.length; index++) {
						const indicatorMetadata = $scope.baseIndicators[index];
						var letterValue = kommonitorScriptHelperService.getAlphabetLetterFromNumber(index);

						baseIndicators_formula+=letterValue;
						baseIndicators_legend+="$" + letterValue + "$: " + indicatorMetadata.indicatorName + " [" + indicatorMetadata.unit +  "]";
						if(index < $scope.baseIndicators.length - 1){
							baseIndicators_formula+=" + ";
							baseIndicators_legend+="<br/>"; 
						}
					}
					$scope.legendValues.list_baseIndicators = baseIndicators_legend;
					formula = formula.replace("sum_baseIndicators", baseIndicators_formula);
				}

				if(formula.includes('prod_baseIndicators')) {
					baseIndicators_formula = "";
					baseIndicators_legend = "";
					for (let index = 0; index < $scope.baseIndicators.length; index++) {
						const indicatorMetadata = $scope.baseIndicators[index];
						var letterValue = kommonitorScriptHelperService.getAlphabetLetterFromNumber(index);
	
						baseIndicators_formula+=letterValue;
						baseIndicators_legend+="$" + letterValue + "$: " + indicatorMetadata.indicatorName  + " [" + indicatorMetadata.unit +  "]";
						if(index < $scope.baseIndicators.length - 1){
							baseIndicators_formula+=" \\times ";
							baseIndicators_legend+="<br/>"; 
						}
					}
					$scope.legendValues.list_baseIndicators = baseIndicators_legend;
					formula = formula.replace("prod_baseIndicators", baseIndicators_formula);
				}

				return formula;
			}

			function replaceGeoresourceFilterPlaceholder(str) {
				var filterLegendHTML = "";
				if ($scope.compFilterData.propertyName !== undefined && $scope.compFilterData.operator && $scope.compFilterData.operator.apiName !== undefined && ($scope.compFilterData.propertyValue != undefined || $scope.compFilterData.propertyValueSelection != undefined)) {
					filterLegendHTML = "'" + $scope.compFilterData.propertyName + "' '" + $scope.compFilterData.operator.displayName + "' '" + $scope.compFilterData.propertyValue + "'";
					if ($scope.compFilterData.operator.apiName === "Range") {
						filterLegendHTML = "'" + $scope.compFilterData.propertyName + "' im " +  "Wertebereich von '>=" +  $scope.compFilterData.propertyValueRange_from + " bis <" + $scope.compFilterData.propertyValueRange_to + "'";
					}
					if ($scope.compFilterData.operator.apiName === "Contains") {
						filterLegendHTML = "'" + $scope.compFilterData.propertyName + "' 'enthält' '" + $scope.compFilterData.propertyValueSelection + "'";
					}
				}
				else {
					filterLegendHTML = "-";
				}
				return str.replace("georesource_filter_legend", filterLegendHTML);
			}

			// parse with regEx to avoid 'eval' or similar unsecure methods
			function parseStringTemplate(str, obj) {
				let parts = str.split(/\$\{(?!\d)[\wæøåÆØÅ.]*\}/);
				let args = str.match(/(?<=\${)[\wæøåÆØÅ.]+(?=})/g) || [];
				let parameters = args.map(argument => {
						let value = argument.split('.').reduce((o, key) => o?.[key], obj);
						return value !== undefined ? value : "";
				});
				return String.raw({ raw: parts }, ...parameters);
			}

			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";

				/*if (!$scope.compIndicatorSelection && !$scope.refIndicatorSelection){
					return;
				}*/

				var formula = kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams.formula;
				
				if(kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams.dynamicFormula) {
					formula = $scope.createDynamicFormula(kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams.dynamicFormula);
				}

				var formulaHTML = "";
				if(kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams.apiName.includes("indicator")){
					var formulaHTML = "<b>Berechnung gem&auml;&szlig; Formel<br/> " + formula;
				}
				
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

				if(dynamicLegendStr.includes('georesource_filter_legend')) {
					dynamicLegendStr = replaceGeoresourceFilterPlaceholder(dynamicLegendStr);
				}
				
				var legendText = parseStringTemplate(dynamicLegendStr, $scope.legendValues)

				if(kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams.apiName.includes("indicator")){
					kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + "<b>Legende zur Formel</b><br/>" + legendText;
				}
				else {
					kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + "<b></b><br/>" + legendText;
				}
			
			};
	
		}
	]
});
