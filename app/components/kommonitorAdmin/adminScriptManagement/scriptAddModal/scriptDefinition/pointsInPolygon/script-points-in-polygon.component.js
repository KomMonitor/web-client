angular.module('scriptPointsInPolygon').component('scriptPointsInPolygon', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/pointsInPolygon/script-points-in-polygon.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function ScriptScriptPointsInPolygonController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.pathToScriptResource = "./kommonitor-script-resources/km_georessouce_count_pointsWithinPolygon.js";

			$scope.operatorOptions = [
				{
					"apiName": "Equal",
					"displayName": "gleich",
				},
				{
					"apiName": "Greater_than",
					"displayName": "größer als",
				},
				{
					"apiName": "Greater_than_or_equal",
					"displayName": "größer als oder gleich",
				},
				{
					"apiName": "Less_than",
					"displayName": "kleiner als",
				},
				{
					"apiName": "Less_than_or_equal",
					"displayName": "kleiner als oder gleich",
				},
				{
					"apiName": "Unequal",
					"displayName": "ungleich",
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
			$scope.parameterName_computationFilterProperty = "compFilterProp";
			$scope.parameterDescription_computationFilterProperty = "Georessourcen Attributname.";
			$scope.parameterDefaultValue_computationFilterProperty = undefined;
			$scope.parameterNumericMinValue_computationFilterProperty = 0;
			$scope.parameterNumericMaxValue_computationFilterProperty = 1;

			// parameter for logical operator
			$scope.parameterName_computationFilterOperator = "compFilterOperator";
			$scope.parameterDescription_computationFilterOperator = "Vergleichsoperator";
			$scope.parameterDefaultValue_computationFilterOperator = undefined;
			$scope.parameterNumericMinValue_computationFilterOperator = 0;
			$scope.parameterNumericMaxValue_computationFilterOperator = 1;

			// parameter for property value
			$scope.parameterName_computationFilterPropertyValue = "compFilterPropVal";
			$scope.parameterDescription_computationFilterPropertyValue = "Filterwert.";
			$scope.parameterDefaultValue_computationFilterPropertyValue = undefined;
			$scope.parameterNumericMinValue_computationFilterPropertyValue = 0;
			$scope.parameterNumericMaxValue_computationFilterPropertyValue = 1;

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
				$scope.resetComputationFormulaAndLegend();				
			};

			$scope.onChangePropertyName = function(){
				$scope.resetScriptParameter_filterPropertyName();
				$scope.resetComputationFormulaAndLegend();	
			};

			$scope.onChangeOperatorOption = function(){
				$scope.resetScriptParameter_operator();
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
				$scope.parameterDefaultValue_computationGeoresource = $scope.resetScriptParameter_computationGeoresource($scope.georesourceSelection);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationGeoresource, $scope.parameterDescription_computationGeoresource, $scope.parameterDataType, $scope.parameterDefaultValue_computationGeoresource, $scope.parameterNumericMinValue_computationGeoresource, $scope.parameterNumericMaxValue_computationGeoresource);
			};

			$scope.resetScriptParameter_filterPropertyName = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterProperty);
				$scope.parameterDefaultValue_computationFilterProperty = $scope.propertyName;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterProperty, $scope.parameterDescription_computationFilterProperty, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterProperty, $scope.parameterNumericMinValue_computationFilterProperty, $scope.parameterNumericMaxValue_computationFilterProperty);
			};

			$scope.resetScriptParameter_operator = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterOperator);
				$scope.parameterDefaultValue_computationFilterOperator = $scope.operator.apiName;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterOperator, $scope.parameterDescription_computationFilterOperator, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterOperator, $scope.parameterNumericMinValue_computationFilterOperator, $scope.parameterNumericMaxValue_computationFilterOperator);
			};

			$scope.resetScriptParameter_filterPropertyValue = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterPropertyValue);
				$scope.parameterDefaultValue_computationFilterPropertyValue = $scope.propertyValue;
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterPropertyValue, $scope.parameterDescription_computationFilterPropertyValue, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterPropertyValue, $scope.parameterNumericMinValue_computationFilterPropertyValue, $scope.parameterNumericMaxValue_computationFilterPropertyValue);
			};

			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";
				var formulaHTML = "";
				if ($scope.propertyName !== undefined && $scope.operator && $scope.operator.apiName !== undefined && $scope.propertyValue != undefined) {
					formulaHTML = "<b>Berechnung gem&auml;&szlig; Geodatenanalyse<br/><i>Anzahl Punkte des Datensatzes G<sub>1</sub> pro Raumeinheits-Feature, die folgendem Filterkriterium entsprechen:</i> '" + $scope.propertyName + "' '" + $scope.operator.displayName + "' '" + $scope.propertyValue + "'";
				}
				else {
					formulaHTML = "<b>Berechnung gem&auml;&szlig; Geodatenanalyse<br/><i>Anzahl Punkte des Datensatzes G<sub>1</sub> pro Raumeinheits-Feature</i>";
				}
				var legendItemsHTML = "<b>Legende zur Geodatenanalyse</b><br/>G<sub>1</sub>: " + $scope.georesourceSelection.datasetName;

				kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
			};	
		}
	]
});
