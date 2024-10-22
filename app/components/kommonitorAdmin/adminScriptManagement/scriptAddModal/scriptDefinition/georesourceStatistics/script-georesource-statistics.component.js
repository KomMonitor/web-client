angular.module('scriptGeoresourceStatistics').component('scriptGeoresourceStatistics', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/georesourceStatistics/script-georesource-statistics.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorCacheHelperService',
		function ScriptGeoresourceStatisticsController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout, kommonitorCacheHelperService) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.pathToScriptResource = "./kommonitor-script-resources/km_georesource_miscStatistics.js";

			$scope.propertySchema = {};
			$scope.numericPropertyOptions = undefined;

			$scope.compOptions = [
				{
					"apiName": "MIN",
					"displayName": "Minimum",
				},
				{
					"apiName": "MAX",
					"displayName": "Maximum",
				},
				{
					"apiName": "MEAN",
					"displayName": "Arithmetisches Mittel",
				},
				{
					"apiName": "MEDIAN",
					"displayName": "Median",
				},
				{
					"apiName": "SUM",
					"displayName": "Summe",
				},
				{
					"apiName": "STANDARD_DEVIATION",
					"displayName": "Standardabweichung",
				}
			];

			$scope.georesourceSelection = undefined;
			$scope.georesourceSelection_old = undefined;

			// parameter for georesource dataset
			$scope.parameterName_computationGeoresource = "compGeoId";
			$scope.parameterDescription_computationGeoresource = "Georessourcen ID des Punktdatensatzes.";
			$scope.parameterDefaultValue_computationGeoresource = undefined;
			$scope.parameterNumericMinValue_computationGeoresource = 0;
			$scope.parameterNumericMaxValue_computationGeoresource = 1;

			// parameter for object property name
			$scope.parameterName_computationProperty = "compProp";
			$scope.parameterDescription_computationProperty = "Georessourcen Attributname.";
			$scope.parameterDefaultValue_computationProperty = undefined;
			$scope.parameterNumericMinValue_computationProperty = 0;
			$scope.parameterNumericMaxValue_computationProperty = 1;

			// parameter for computation method
			$scope.parameterName_computationMethod = "compMeth";
			$scope.parameterDescription_computationMethod = "Statistische Berechnungsmethode.";
			$scope.parameterDefaultValue_computationMethod = undefined;
			$scope.parameterNumericMinValue_computationMethod = 0;
			$scope.parameterNumericMaxValue_computationMethod = 1;

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

			$scope.onChangeGeoresource = function(georesourceSelection){
				// remove previous refIndicator from requiredIndicators and add new one
				if($scope.georesourceSelection_old){
					kommonitorScriptHelperService.removeBaseGeoresource($scope.georesourceSelection_old);	
				}
				kommonitorScriptHelperService.addBaseGeoresource(georesourceSelection);

				$scope.georesourceSelection_old = georesourceSelection;

				//reset the one and only parameter in this case each time a base indicator is added
				$scope.resetGeoresourceParameter();
				$scope.resetNumericPropertyOptions();
				$scope.resetComputationFormulaAndLegend();				

			};

			$scope.resetNumericPropertyOptions = function(){
				$scope.propertySchema = {};
				kommonitorCacheHelperService.fetchSingleGeoresourceSchema($scope.parameterDefaultValue_computationGeoresource)
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
				$scope.resetScriptParameter_objectPropertyName();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeComputationOption = function(){
				$scope.resetScriptParameter_computationMethod();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.resetScriptParameter_computationGeoresource = function(georesourceMetadata){

				return georesourceMetadata.georesourceId;
			};

			$scope.resetGeoresourceParameter = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationGeoresource);
				$scope.parameterDefaultValue_computationGeoresource = $scope.resetScriptParameter_computationGeoresource($scope.georesourceSelection);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationGeoresource, $scope.parameterDescription_computationGeoresource, $scope.parameterDataType, $scope.parameterDefaultValue_computationGeoresource, $scope.parameterNumericMinValue_computationGeoresource, $scope.parameterNumericMaxValue_computationGeoresource);
			};

			$scope.resetScriptParameter_objectPropertyName = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationProperty);
				$scope.parameterDefaultValue_computationProperty = $scope.numericPropertyName;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationProperty, $scope.parameterDescription_computationProperty, $scope.parameterDataType, $scope.parameterDefaultValue_computationProperty, $scope.parameterNumericMinValue_computationProperty, $scope.parameterNumericMaxValue_computationProperty);
			};

			$scope.resetScriptParameter_computationMethod = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationMethod);
				$scope.parameterDefaultValue_computationMethod = $scope.compMethod.apiName;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationMethod, $scope.parameterDescription_computationMethod, $scope.parameterDataType, $scope.parameterDefaultValue_computationMethod, $scope.parameterNumericMinValue_computationMethod, $scope.parameterNumericMaxValue_computationMethod);
			};

			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";

				var formulaHTML = "<b>Geodatenanalyse: Statistische Berechnung <i>'" + $scope.compMethod.displayName + "' anhand Objekteigenschaft '" + $scope.numericPropertyName + "'</i> f&uuml;r alle Punktobjekte des Datensatzes G<sub>1</sub> innerhalb des jeweiligen Raumebenen-Raumeinheiten</i>";
				var legendItemsHTML = "<b>Legende zur Geodatenanalyse</b><br/>G<sub>1</sub>: " + $scope.georesourceSelection.datasetName;

				kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
			};	
		}
	]
});
