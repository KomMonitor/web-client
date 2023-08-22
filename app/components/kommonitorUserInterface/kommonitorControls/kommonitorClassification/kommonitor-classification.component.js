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
						$scope.addBtnHeight = 0;
						$scope.showAddBtn = false;
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
								description: 'Bei der manuellen Klassifizierung lassen sich die Klassengrenzen nach Bedarf einstellen.'}
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

						$scope.getHeightInElement = function (e) {
							var rect = e.currentTarget.getBoundingClientRect();
							var y = Math.floor(e.clientY - rect.top);
							$scope.addBtnHeight = y;
							return y;
						}

						$scope.toggleAddBtn = function (e) {
							if(!$scope.showAddBtn && e.buttons === 0) {
								$scope.showAddBtn = true;
								setTimeout(function () {
									$scope.$apply(function(){
										//$scope.showAddBtn = false;
									});
								}, 1500);
							}
						}

						$scope.addNewBreak = function () {
							let histogram = document.querySelector("#editableHistogram");
							if(kommonitorVisualStyleHelperService.manualBrew.breaks.length <  10) {
								if($scope.addBtnHeight >= 0 && $scope.addBtnHeight < histogram.offsetHeight) {
									let breaks = kommonitorVisualStyleHelperService.manualBrew.breaks;
									let newBreak = Math.floor(($scope.addBtnHeight / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
									kommonitorVisualStyleHelperService.manualBrew.breaks.push(newBreak);
									kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
										return a - b;
									});
									$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
								}
							}
						}

						$scope.deleteBreak = function (i) {
							kommonitorVisualStyleHelperService.manualBrew.breaks.splice(i, 1);
							$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
						}

						$scope.onBreaksChanged = function (e) {
							e.currentTarget.disabled = true;
							kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
								return a - b;
							});
							$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
						}

						$scope.onBreakDblClick = function (e) {
							let input = e.currentTarget.children[0].children[0];
							input.disabled = false;
							input.focus();

							if (window.getSelection) {
								window.getSelection().removeAllRanges();
							} else if (document.selection) {
									document.selection.empty();
							}
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
								countArray.push(kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0);
							})
							return (countArray[i] / Math.max(...countArray)) * 100 || 0;
						};
						$scope.getWidthForHistogramBarMOV = function (side, i) {
							let colors = [...kommonitorVisualStyleHelperService.measureOfValueBrew[0].colors, ...kommonitorVisualStyleHelperService.measureOfValueBrew[1].colors];
							let countArray = [];
							colors.forEach(function (color) {
								countArray.push(kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0);
							})
							color = kommonitorVisualStyleHelperService.measureOfValueBrew[side].colors[i];
							count = kommonitorVisualStyleHelperService.featuresPerColorMap.get(color);
							return (count / Math.max(...countArray)) * 100 || 0;
						};
						$scope.getHeightForBar = function (i) {
							let size = kommonitorVisualStyleHelperService.manualBrew.breaks[i+1] - kommonitorVisualStyleHelperService.manualBrew.breaks[i];
							return (size / ($scope.getMaxValue() - $scope.getMinValue())) * 100;
						};
						$scope.getHeightForBarMOV = function (site, i) {
							let size = kommonitorVisualStyleHelperService.measureOfValueBrew[site].breaks[i+1] - kommonitorVisualStyleHelperService.measureOfValueBrew[site].breaks[i];
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
						$scope.onBreakMouseMove = function (e, i) {
							$scope.showAddBtn = false;

							if(e.buttons === 1) {
								let histogram = document.querySelector("#editableHistogram");

								let newHeight = $scope.addBtnHeight / histogram.offsetHeight * 100;
								e.currentTarget.style.top = newHeight + "%";
							
								(async () => {
									let breaks = kommonitorVisualStyleHelperService.manualBrew.breaks;
									let newBreak = Math.floor(($scope.addBtnHeight / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
									e.currentTarget.children[0].children[0].value = newBreak;
									kommonitorVisualStyleHelperService.manualBrew.breaks[i] = newBreak;
									kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
										return a - b;
									});
									$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
								})();
							}
						}
					}
				]
			}
		);