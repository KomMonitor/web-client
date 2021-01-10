angular.module('scriptPointsInPolygon').component('scriptPointsInPolygon', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/pointsInPolygon/script-points-in-polygon.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function ScriptScriptPointsInPolygonController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.pathToScriptResource = "./kommonitor-script-resources/km_georessouce_count_pointsWithinPolygon.js";

			$scope.georesourceSelection = undefined;
			$scope.georesourceSelection_old = undefined;

			$scope.parameterName_computationGeoresource = "compGeoId";
			$scope.parameterDescription_computationGeoresource = "Georessourcen ID des Punktdatensatzes.";
			$scope.parameterDefaultValue_computationGeoresource = undefined;
			$scope.parameterNumericMinValue_computationGeoresource = 0;
			$scope.parameterNumericMaxValue_computationGeoresource = 1;

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

			$scope.resetScriptParameter_computationGeoresource = function(georesourceMetadata){

				return georesourceMetadata.georesourceId;
			};

			$scope.resetGeoresourceParameter = function(){
				kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationGeoresource);
				$scope.parameterDefaultValue_computationGeoresource = $scope.resetScriptParameter_computationGeoresource($scope.georesourceSelection);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationGeoresource, $scope.parameterDescription_computationGeoresource, $scope.parameterDataType, $scope.parameterDefaultValue_computationGeoresource, $scope.parameterNumericMinValue_computationGeoresource, $scope.parameterNumericMaxValue_computationGeoresource);
			};

			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";

				var formulaHTML = "<b>Berechnung gem&auml;&szlig; Geodatenanalyse<br/><i>Anzahl Punkte des Datensatzes G<sub>1</sub> pro Raumeinheits-Feature</i>";
				var legendItemsHTML = "<b>Legende zur Geodatenanalyse</b><br/>G<sub>1</sub>: " + $scope.georesourceSelection.datasetName;

				kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
			};	
		}
	]
});
