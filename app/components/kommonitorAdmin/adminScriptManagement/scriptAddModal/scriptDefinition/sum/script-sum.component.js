angular.module('scriptSum').component('scriptSum', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/sum/script-sum.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function ScriptSumController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.pathToScriptResource = "./kommonitor-script-resources/km_indicator_sum.js";

			$scope.tmpIndicatorSelection = undefined;
			$scope.tmpGeoresourceSelection = undefined;

			$scope.baseIndicators = [];

			$scope.parameterName = "COMPUTATION_ID";
			$scope.parameterDescription = "Komma-separierte Liste aller Indikatoren-IDs zur Summenbildung.";
			$scope.parameterDefaultValue = undefined;
			$scope.parameterNumericMinValue = 0;
			$scope.parameterNumericMaxValue = 1;

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

			$scope.generateParameterValue = function(requiredIndicatorsArray){

				var result="";
				for (let index = 0; index < requiredIndicatorsArray.length; index++) {
					const indicatorMetadata = requiredIndicatorsArray[index];
					result+=indicatorMetadata.indicatorId;
					if(index < requiredIndicatorsArray.length - 1){
						result+=","; 
					}
				}

				return result;
			};

			$scope.resetScriptParameter = function(){
				kommonitorScriptHelperService.requiredScriptParameters_tmp = [];
				$scope.parameterDefaultValue = $scope.generateParameterValue($scope.baseIndicators);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName, $scope.parameterDescription, $scope.parameterDataType, $scope.parameterDefaultValue, $scope.parameterNumericMinValue, $scope.parameterNumericMaxValue);
			};

			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";

				var formulaHTML = "<b>Berechnung gem&auml;&szlig; Formel<br/><i>";
				var legendItemsHTML = "<b>Legende zur Formel</b><br/>";

				for (let index = 0; index < $scope.baseIndicators.length; index++) {
					const indicatorMetadata = $scope.baseIndicators[index];
					formulaHTML+="I<sub>" + index + 1 + "</sub>";
					legendItemsHTML+="<i>I<sub>" + index + 1 + "</sub></i>: " + indicatorMetadata.indicatorName;
					if(index < $scope.baseIndicators.length - 1){
						formulaHTML+=" + ";
						legendItemsHTML+="<br/>"; 
					}
				}

				formulaHTML += "</i>";

				kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
			};

			$scope.addBaseIndicator = function(tmpIndicatorSelection){

				kommonitorScriptHelperService.addBaseIndicator(tmpIndicatorSelection);
				$scope.baseIndicators.push(tmpIndicatorSelection);

				//reset the one and only parameter in this case each time a base indicator is added
				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();

				setTimeout(() => {
					$scope.$apply();
				});
			};

			$scope.removeBaseIndicator = function(baseIndicator){
				kommonitorScriptHelperService.removeBaseIndicator(baseIndicator);

				var i;
				for (let index = 0; index < $scope.baseIndicators.length; index++) {
					const element = $scope.baseIndicators[index];
					
					if(baseIndicator.indicatorId == element.indicatorId){
						i = index;
						break;
					}
				}
				$scope.baseIndicators.splice(i, 1);

				//reset the one and only parameter in this case each time a base indicator is removed
				$scope.resetScriptParameter();
				$scope.resetComputationFormulaAndLegend();
				
				setTimeout(() => {
					$scope.$apply();
				});
			};
	
		}
	]
});
