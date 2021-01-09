angular.module('scriptDivision').component('scriptDivision', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/division/script-division.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function ScriptDivisionController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.pathToScriptResource = "./kommonitor-script-resources/km_indicator_divide.js";

			$scope.tmpIndicatorSelection = undefined;
			$scope.tmpGeoresourceSelection = undefined;

			$scope.refIndicatorSelection = undefined;
			$scope.refIndicatorSelection_old = undefined;

			$scope.compIndicatorSelection = undefined;
			$scope.compIndicatorSelection_old = undefined;

			$scope.parameterName_computationIndicators = "COMPUTATION_ID_numerator";
			$scope.parameterDescription_computationIndicators = "Indikatoren-ID des Dividenden.";
			$scope.parameterDefaultValue_computationIndicators = undefined;
			$scope.parameterNumericMinValue_computationIndicators = 0;
			$scope.parameterNumericMaxValue_computationIndicators = 1;

			$scope.parameterName_referenceIndicator = "COMPUTATION_ID_denominator";
			$scope.parameterDescription_referenceIndicator = "Indikatoren-ID des Divisors.";
			$scope.parameterDefaultValue_referenceIndicator = undefined;
			$scope.parameterNumericMinValue_referenceIndicator = 0;
			$scope.parameterNumericMaxValue_referenceIndicator = 1;

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

			$scope.onChangeReferenceIndicator = function(refIndicatorSelection){
				// remove previous refIndicator from requiredIndicators and add new one
				if($scope.refIndicatorSelection_old){					
					kommonitorScriptHelperService.removeBaseIndicator($scope.refIndicatorSelection_old);
				}
				kommonitorScriptHelperService.addBaseIndicator(refIndicatorSelection);

				$scope.refIndicatorSelection_old = refIndicatorSelection;

				//reset the one and only parameter in this case each time a base indicator is added
				$scope.resetRefIndicatorParameter();
				$scope.resetComputationFormulaAndLegend();				

			};

			$scope.onChangeComputationIndicator = function(compIndicatorSelection){
				// remove previous refIndicator from requiredIndicators and add new one
				if($scope.compIndicatorSelection_old){
					kommonitorScriptHelperService.removeBaseIndicator($scope.compIndicatorSelection_old);
				}				
				kommonitorScriptHelperService.addBaseIndicator(compIndicatorSelection);

				$scope.compIndicatorSelection_old = compIndicatorSelection;

				//reset the one and only parameter in this case each time a base indicator is added
				$scope.resetCompIndicatorParameter();
				$scope.resetComputationFormulaAndLegend();				

			};

			$scope.resetRefIndicatorParameter = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_referenceIndicator);
				$scope.parameterDefaultValue_referenceIndicator = $scope.refIndicatorSelection.indicatorId;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_referenceIndicator, $scope.parameterDescription_referenceIndicator, $scope.parameterDataType, $scope.parameterDefaultValue_referenceIndicator, $scope.parameterNumericMinValue_referenceIndicator, $scope.parameterNumericMaxValue_referenceIndicator);
			};

			$scope.resetCompIndicatorParameter = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationIndicators);
				$scope.parameterDefaultValue_computationIndicators = $scope.compIndicatorSelection.indicatorId;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationIndicators, $scope.parameterDescription_computationIndicators, $scope.parameterDataType, $scope.parameterDefaultValue_computationIndicators, $scope.parameterNumericMinValue_computationIndicators, $scope.parameterNumericMaxValue_computationIndicators);
			};

			$scope.resetComputationFormulaAndLegend = function(){

				if($scope.refIndicatorSelection && $scope.compIndicatorSelection){
					kommonitorScriptHelperService.scriptFormulaHTML = "";

					var formulaHTML = "<b>Berechnung gem&auml;&szlig; Formel<br/><i>I<sub>1</sub> / I<sub>2</sub></i>";
					var legendItemsHTML = "<b>Legende zur Formel</b>";				
			
					legendItemsHTML+="<br/><i>I<sub>1</sub></i>: " + $scope.compIndicatorSelection.indicatorName;
					legendItemsHTML+="<br/><i>I<sub>2</sub></i>: " + $scope.refIndicatorSelection.indicatorName;

					kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
				}
			};	
		}
	]
});
