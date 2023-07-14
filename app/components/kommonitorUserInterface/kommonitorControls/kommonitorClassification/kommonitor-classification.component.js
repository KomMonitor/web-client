angular
	.module('kommonitorClassification')
	.component(
			'kommonitorClassification',
			{
				templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorClassification/kommonitor-classification.template.html",
				controller : [ '$scope', '$rootScope', '$timeout', 'kommonitorVisualStyleHelperService', 'kommonitorDataExchangeService',
					function KommonitorClassification($scope, $rootScope, $timeout, kommonitorVisualStyleHelperService, kommonitorDataExchangeService) {
						this.kommonitorVisualStyleHelperServiceInstance = kommonitorVisualStyleHelperService;
						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

						$scope.methodName = 'Klassifizierungsmethode auswählen';
						$scope.showMethodSelection = false;
						kommonitorVisualStyleHelperService.numClasses = 5;

						$scope.methods = [
							{
								name: 'Jenks', 
								id: 'jenks',
								imgPath: 'icons/classificationMethods/neu/jenks.svg',
								description: 'Bei Jenks (Natürliche Unterbrechungen) werden Klassengrenzen identifiziert, die ähnliche Werte möglichst gut gruppieren und zugleich die Unterschiede zwischen den Klassen maximieren.'
							},
							{
								name: 'Gleiches Intervall', 
								id: 'equal_interval', 
								imgPath: 'icons/classificationMethods/neu/gleichesIntervall.svg',
								description: 'Mit der Methode Gleiches Intervall wird der Bereich der Attributwerte in gleich große Teilbereiche unterteilt.'},
							{
								name: 'Quantile', 
								id: 'quantile', 
								imgPath: 'icons/classificationMethods/neu/quantile_grau.svg',
								description: 'Bei der Quantil-Methode enthält jede Klasse die gleiche Anzahl von Features.'},
							{
								name: 'Manuell', 
								id: 'manual', 
								imgPath: 'icons/classificationMethods/neu/manuell.svg',
								description: 'Bei der manuellen Klassifizierung lassen sich die Klassengrenzen von Hand einstellen.'}
						];

						$scope.onMethodSelected = function (method) {
							$scope.methodName = method.name;
							$scope.showMethodSelection = false;
							kommonitorVisualStyleHelperService.classifyMethod = method.id;
							$rootScope.$broadcast("changeClassifyMethod", kommonitorVisualStyleHelperService.classifyMethod);
						}
						
						$scope.onChangeSelectedClassifyMethod = function () {
							$rootScope.$broadcast("changeClassifyMethod", kommonitorVisualStyleHelperService.classifyMethod);
						} 

						$scope.onChangeNumberOfClasses = function () {
							$rootScope.$broadcast("changeNumClasses", kommonitorVisualStyleHelperService.numClasses);
						}

						$scope.onBreaksChanged = function () {
							kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
								return a - b;
							});
							$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
						}

						$scope.onMOVBreaksChanged = function () {
							kommonitorVisualStyleHelperService.manualMOVBreaks[0] = kommonitorVisualStyleHelperService.measureOfValueBrew[0].breaks;
							kommonitorVisualStyleHelperService.manualMOVBreaks[1] = kommonitorVisualStyleHelperService.measureOfValueBrew[1].breaks;
							
							kommonitorVisualStyleHelperService.manualMOVBreaks[0].sort(function(a, b) {return a - b;});
							kommonitorVisualStyleHelperService.manualMOVBreaks[1].sort(function(a, b) {return a - b;});


							$rootScope.$broadcast("changeMOVBreaks", kommonitorVisualStyleHelperService.manualMOVBreaks);
						}
						
						$scope.onWholeTimeseriesClassificationCheckboxChanged = function () {
							$rootScope.$broadcast("restyleCurrentLayer", false);
						}

						$scope.getWidthForBar = function (i) {
							let nrItems = 0;
							kommonitorVisualStyleHelperService.manualBrew.colors.forEach(color => {
								nrItems += kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0;
							});
							let color = kommonitorVisualStyleHelperService.manualBrew.colors[i];
							let countFeatures = kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0;
							let returnVal = (countFeatures / nrItems) * 100;
							return returnVal;
						}

						$scope.getHistogramNumber = function (i) {
							let color = kommonitorVisualStyleHelperService.manualBrew.colors[i];
							let countFeatures = kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0;
							return countFeatures;
						}


						// for histogram:
						$scope.getWidthForHistogramBar = function (i) {
							let colors = kommonitorVisualStyleHelperService.manualBrew.colors;
							let countArray = [];
							colors.forEach(function (color) {
								countArray.push(kommonitorVisualStyleHelperService.featuresPerColorMap.get(color));
							})
							return (countArray[i] / Math.max(...countArray)) * 100 || 0;
						};
						$scope.getHeightForBar = function (i) {
							let size = kommonitorVisualStyleHelperService.manualBrew.breaks[i+1] - kommonitorVisualStyleHelperService.manualBrew.breaks[i];
							return (size / ($scope.getMaxValue() - $scope.getMinValue())) * 100;
						};
						$scope.getPercentage = function (n) {
							return ((n - $scope.getMinValue()) / ($scope.getMaxValue() - $scope.getMinValue())) * 100;
						};
						$scope.getMaxValue = function ()  {
							breaks = kommonitorVisualStyleHelperService.manualBrew.breaks;
							return breaks[breaks.length - 1];
						}
						$scope.getMinValue = function () {
							return kommonitorVisualStyleHelperService.manualBrew.breaks[0];
						}
						$scope.onBreakMouseMove = function (e) {
							console.log(e);
							console.log(e.target.parentNode.parentNode);
							console.log(e.buttons);
						}
					}
				]
			}
		);