angular.module('scriptHeadlineIndicator').component('scriptHeadlineIndicator', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/headlineIndicator/script-headline-indicator.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function ScriptHeadlineIndicatorController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();

			$scope.pathToScriptResource = "./kommonitor-script-resources/km_headline_indicator.js";

			$scope.tmpIndicatorSelection = undefined;
			$scope.tmpGeoresourceSelection = undefined;

			$scope.baseIndicators = [];

			$scope.polarityOptions = [
				{
					"apiName": "regular",
					"displayName": "normal [(value - min) / (max - min)]"
				},
				{
					"apiName": "inverted",
					"displayName": "invertiert [1 - ((value - min) / (max - min))]"
				}
			];

			$scope.tmpIndicatorPolarity = $scope.polarityOptions[0];

			$scope.aggregationOptions = [
				{
					"apiName": "geomean",
					"displayName": "Geometrisches Mittel"
				},
				{
					"apiName": "mean",
					"displayName": "Arithmetrisches Mittel"
				},
				{
					"apiName": "min",
					"displayName": "Minimum"
				}
			];

			$scope.aggregationOption = $scope.aggregationOptions[0];

			$scope.fixProcessDescription = "<b><i><u>Berechnung:</u></i></b> Verkn&uuml;pfung der (Basis-)Indikatoren zu einem Leitindikator durch Verkettung der Berechnungsschritte <i>rank, Min-Max-Normalisierung (normal/invertiert), Aggregation (geometrisches" 
				+ "Mittel, Mittelwert oder Minimalwert)</i> <br/> "
				+ "Eine Normierung der (Basis-)Indikatoren wird durch die Vergabe von Rangpl&auml;tzen erreicht. Hierbei werden die Wertauspr&auml;gungen aller Raumeinheiten f&uuml;r jeden (Basis-)Indikator in eine Rangfolge gebracht. Die Raumeinheit mit der inhaltlich am schlechtesten zu wertenden "
			    + "Auspr&auml;gung erh&auml;lt dabei den Rang 1, wohingegen die Raumeinheit mit der besten Wertauspr&auml;gung den "
				+ "h&ouml;chsten Rang (n = Anzahl der Raumeinheiten) erh&auml;lt. Um einen standardisierten Wertebereich zu erzeugen, "
				+ "werden die Werte der (Basis-)Indikator noch vor der Aggregation auf eine Skala von null bis 1 "
				+ "normiert, wobei der schlechteste Wert jeweils eine null erh&auml;lt und der beste Wert eine 1 (Min/Max-Normierung). Anschließend k&ouml;nnen die Werte dann mit Hilfe des geeigneten Aggregationsverfahrens "
				+ "(geometrisches Mittel, Mittelwert oder Minimalwert) zum Leitindikator 1. Ordnung verkn&uuml;pft werden. ";
				
		
		
		
		 
				

			$scope.parameterName_compArray = "COMPUTATION_ID_ARRAY";
			$scope.parameterDescription_compArray = "Komma-separierte Liste aller Indikatoren-IDs zur Leitindikatorbildung.";
			$scope.parameterDefaultValue_compArray = undefined;
			$scope.parameterNumericMinValue_compArray = 0;
			$scope.parameterNumericMaxValue_compArray = 1;

			$scope.parameterName_polArray = "COMPUTATION_POLARITY_ARRAY";
			$scope.parameterDescription_polArray = "Komma-separierte Liste aller Min-Max-Polarit&auml;ten der zugeh&ouml;rigen Indikatoren zur Leitindikatorbildung. Die Reihenfolge muss der Reihenfolge der Indikatoren-IDs des Parameters 'COMPUTATION_ID_ARRAY' entsprechen.";
			$scope.parameterDefaultValue_polArray = 'regular';
			$scope.parameterNumericMinValue_polArray = 0;
			$scope.parameterNumericMaxValue_polArray = 1;

			$scope.parameterName_aggregationOption = "AGGREGATION_METHOD";
			$scope.parameterDescription_aggregationOption = "Angabe der Aggregationsmethode zur Leitindikatorbildung. Standard ist das geometrische Mittel.";
			$scope.parameterDefaultValue_aggregationOption = "geomean";
			$scope.parameterNumericMinValue_aggregationOption = 0;
			$scope.parameterNumericMaxValue_aggregationOption = 1;

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

			$scope.generateParameterValue_compArray = function(requiredIndicatorsArray){

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

			$scope.generateParameterValue_polArray = function(requiredIndicatorsArray){

				var result="";
				for (let index = 0; index < requiredIndicatorsArray.length; index++) {
					const indicatorMetadata = requiredIndicatorsArray[index];
					result+=indicatorMetadata.polarity.apiName;
					if(index < requiredIndicatorsArray.length - 1){
						result+=","; 
					}
				}

				return result;
			};

			$scope.resetScriptParameter = function(){
				kommonitorScriptHelperService.requiredScriptParameters_tmp = [];
				$scope.parameterDefaultValue_compArray = $scope.generateParameterValue_compArray($scope.baseIndicators);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_compArray, $scope.parameterDescription_compArray, $scope.parameterDataType, $scope.parameterDefaultValue_compArray, $scope.parameterNumericMinValue_compArray, $scope.parameterNumericMaxValue_compArray);
				$scope.parameterDefaultValue_polArray = $scope.generateParameterValue_polArray($scope.baseIndicators);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_polArray, $scope.parameterDescription_polArray, $scope.parameterDataType, $scope.parameterDefaultValue_polArray, $scope.parameterNumericMinValue_polArray, $scope.parameterNumericMaxValue_polArray);
				kommonitorScriptHelperService.addScriptParameter($scope.parameterName_aggregationOption, $scope.parameterDescription_aggregationOption, $scope.parameterDataType, $scope.aggregationOption.apiName, $scope.parameterNumericMinValue_aggregationOption, $scope.parameterNumericMaxValue_aggregationOption);
			};

			$scope.resetComputationFormulaAndLegend = function(){
				kommonitorScriptHelperService.scriptFormulaHTML = "";

				var formulaHTML = "<b>Berechnung durch Verkettung der Schritte $rank$, $Min-Max-Normalisierung$ und $Aggregation$ f&uuml;r alle Eingangsdaten<br/>";
				var legendItemsHTML = "<b>Eingehende Daten zur Leitindikatorberechnung: </b><br/>";

				var aggregationMethodHTML = "<b>Aggregationsmethode</b>: " + $scope.aggregationOption.displayName;

				formulaHTML += "$ ";				

				for (let index = 0; index < $scope.baseIndicators.length; index++) {
					const indicatorMetadata = $scope.baseIndicators[index];
					var letterValue = kommonitorScriptHelperService.getAlphabetLetterFromNumber(index);

					// we can use TEX code as we use MathJax library
					legendItemsHTML+="$" + letterValue + "$: " + indicatorMetadata.indicatorName;
					if(index < $scope.baseIndicators.length - 1){
						legendItemsHTML+="<br/>"; 
					}
				}

				formulaHTML += " $";

				kommonitorScriptHelperService.scriptFormulaHTML = legendItemsHTML + "<br/><br/>" + formulaHTML;
				
			};

			$scope.addBaseIndicator = function(tmpIndicatorSelection){

				tmpIndicatorSelection.polarity = $scope.tmpIndicatorPolarity;

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
