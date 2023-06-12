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

						$scope.methods = [
							{name: 'Jenks', id: 'jenks', description: 'Bei Jenks (Natürliche Unterbrechungen) werden Klassengrenzen identifiziert, die ähnliche Werte möglichst gut gruppieren und zugleich die Unterschiede zwischen den Klassen maximieren.'},
							{name: 'Gleiches Intervall', id: 'equal_interval', description: 'Mit der Methode Gleiches Intervall wird der Bereich der Attributwerte in gleich große Teilbereiche unterteilt.'},
							{name: 'Quantile', id: 'quantile', description: 'Bei der Quantil-Methode enthält jede Klasse die gleiche Anzahl von Features.'},
							{name: 'Manuell', id: 'manual', description: 'Bei der manuellen Klassifizierung lassen sich die Klassengrenzen von Hand einstellen.'}
						];

						$scope.onMethodSelected = function (method) {
							$scope.methodName = method.name;
							$scope.showMethodSelection = false;
							kommonitorVisualStyleHelperService.classifyMethod = method.id;
							$rootScope.$broadcast("changeClassifyMethod", kommonitorVisualStyleHelperService.classifyMethod);
						}

						// set default values
						kommonitorVisualStyleHelperService.numClasses = 5;
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
					}
				]
			}
		);