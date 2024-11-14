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
						$scope.addBtnHeight = [0, 0];
						$scope.showAddBtn = [false, false];

						$scope.isDraggingBreak = false;
						$scope.draggingBreak = null;
						$scope.nrOfDraggingBreak = null;
						$scope.dynamicDraggingSite = 0;

						$scope.containsZeroValues = false;
						$scope.containsNegativeValues = false;
						$scope.containsOutliers_high = false;
						$scope.containsOutliers_low = false;

						$scope.hiddenMethodIds = [];

						if(__env.disableManualClassification) {
							$scope.hideManualClassification();
						}

						kommonitorVisualStyleHelperService.numClasses = 5;

						kommonitorVisualStyleHelperService.classifyMethod = __env.defaultClassifyMethod || "jenks";

						$scope.colorbrewerSchemes = colorbrewer;
						$scope.colorbrewerPalettes = [];

						$scope.instantiateColorBrewerPalettes = function(){
							for (const key in colorbrewer) {
								if (colorbrewer.hasOwnProperty(key)) {
									const colorPalettes = colorbrewer[key];
									
									var paletteEntry = {
										"paletteName": key,
										"paletteArrayObject": colorPalettes
									};
				
									$scope.colorbrewerPalettes.push(paletteEntry);
								}
							}
				
							// instantiate with palette 'Blues'
							$scope.selectedColorBrewerPaletteEntry = $scope.colorbrewerPalettes[13];

							for (const colorbrewerPalette of $scope.colorbrewerPalettes) {
								if (colorbrewerPalette.paletteName === kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName){
									$scope.selectedColorBrewerPaletteEntry = colorbrewerPalette;
									break;
								}
							}
				
						};

						$scope.$on("onChangeSelectedIndicator", function(event){
							for (const colorbrewerPalette of $scope.colorbrewerPalettes) {
								if (colorbrewerPalette.paletteName === kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName){
									$scope.selectedColorBrewerPaletteEntry = colorbrewerPalette;
									break;
								}
							}
						});

						$scope.onClickColorBrewerEntry = function(colorPaletteEntry){
							$scope.selectedColorBrewerPaletteEntry = colorPaletteEntry;

							kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName = $scope.selectedColorBrewerPaletteEntry.paletteName;
				
							// $rootScope.$broadcast("restyleCurrentLayer", true);
							$rootScope.$broadcast("changeColorScheme", kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName);

							setTimeout(() => {
								$scope.$digest();
							}, 250);
						};

						$scope.instantiateColorBrewerPalettes();

						$rootScope.$on("updateClassificationComponent", function(event, containsZeroValues, containsNegativeValues, containsNoData, containsOutliers_high, containsOutliers_low, outliers_low, outliers_high, selectedDate) {
							$scope.containsZeroValues = containsZeroValues;
							$scope.containsNegativeValues = containsNegativeValues;
							$scope.containsOutliers_high = containsOutliers_high;
							$scope.containsOutliers_low = containsOutliers_low;
							$scope.containsNoData = containsNoData;
						});

						$rootScope.$on("updateShowRegionalDefaultOption", function(event, show) {
							if(show){
								if($scope.hiddenMethodIds.includes('regional_default')) {
									$scope.hiddenMethodIds.splice($scope.hiddenMethodIds.indexOf('regional_default'), 1);
								}
							}
							else {
								if(!$scope.hiddenMethodIds.includes('regional_default')) {
									$scope.hiddenMethodIds.push('regional_default');
								}
							}
						});

						$scope.hideManualClassification = function () {
							if(!$scope.hiddenMethodIds.includes('manual')) {
								$scope.hiddenMethodIds.push('manual');
							}
						}


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

						$scope.toggleAddBtn = function (e, site) {
							if(!$scope.showAddBtn[site] && e.buttons === 0) {
								$scope.showAddBtn = [false, false];
								$scope.showAddBtn[site] = true;
							}

							var rect = e.currentTarget.getBoundingClientRect();
							var y = Math.floor(e.clientY - rect.top);
							if (y > 0 && y < rect.height) {
								$scope.addBtnHeight[site] = y;
							}
						}

						$scope.addNewBreaks = function (site) {
							if((!kommonitorDataExchangeService.isBalanceChecked 
								&& !kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
								&& !$scope.containsNegativeValues) 
								|| kommonitorDataExchangeService.isMeasureOfValueChecked) {
								$scope.addNewBreak();
							}
							else {
								$scope.addNewBreakDynamic(site);
								if(kommonitorDataExchangeService.isMeasureOfValueChecked) {
									$scope.addNewBreak();
								}
							}
						}

						$scope.addNewBreak = function () {
							let histogram = document.querySelectorAll(".editableHistogram")[0];
							if(kommonitorVisualStyleHelperService.manualBrew.breaks.length <  10) {
								if($scope.addBtnHeight[0] >= 0 && $scope.addBtnHeight[0] < histogram.offsetHeight) {
									let breaks = kommonitorVisualStyleHelperService.manualBrew.breaks;
									let newBreak = Math.floor(($scope.addBtnHeight[0] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
									if(!kommonitorVisualStyleHelperService.manualBrew.breaks.includes(newBreak)) {
										kommonitorVisualStyleHelperService.manualBrew.breaks.push(newBreak);
										kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
											return a - b;
										});
										$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
									}

									if((kommonitorDataExchangeService.isBalanceChecked 
										|| kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
										|| $scope.containsNegativeValues)
										&& kommonitorDataExchangeService.isMeasureOfValueChecked) {
										$scope.updateDynamicBreaksFromManualBreaks();
									}
								}
							}
						}

						$scope.addNewBreakDynamic = function (site) {
							let histograms = Array.from(document.querySelectorAll(".editableHistogram"));
							histograms.reverse();
							let histogram = histograms[site];

							if(kommonitorVisualStyleHelperService.dynamicBrew[site].breaks.length <  5) {
								if($scope.addBtnHeight[site] >= 0 && $scope.addBtnHeight[site] < histogram.offsetHeight) {
									let breaks = kommonitorVisualStyleHelperService.dynamicBrew[site].breaks;
									let newBreak = Math.floor(($scope.addBtnHeight[site] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
									if(!kommonitorVisualStyleHelperService.dynamicBrew[site].breaks.includes(newBreak)){
										kommonitorVisualStyleHelperService.dynamicBrew[site].breaks.push(newBreak);
										kommonitorVisualStyleHelperService.dynamicBrew[site].breaks.sort(function(a, b) {
											return a - b;
										});

										let increaseBreaks = kommonitorVisualStyleHelperService.dynamicBrew[0] ? kommonitorVisualStyleHelperService.dynamicBrew[0].breaks : [];
										let decreaseBreaks = kommonitorVisualStyleHelperService.dynamicBrew[1] ? kommonitorVisualStyleHelperService.dynamicBrew[1].breaks : [];
										$rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks]);
									}
								}
							}
						}

						$scope.updateDynamicBreaksFromManualBreaks = function (){
							let increaseBreaks = [];
							let decreaseBreaks = [];
							kommonitorVisualStyleHelperService.manualBrew.breaks.forEach((br) => {
								if (br < 0) {
									decreaseBreaks.push(br);
								}
								else {
									increaseBreaks.push(br);
								}
							});
							$rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks]);
						}

						$scope.breakIsUnalterable = function (br) {
							if(kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
								|| $scope.containsNegativeValues){
								if(kommonitorVisualStyleHelperService.dynamicBrewBreaks) {
									if(kommonitorVisualStyleHelperService.dynamicBrewBreaks[1]) {
										if(br == kommonitorVisualStyleHelperService.dynamicBrewBreaks[1][0]){
											return true;
										}
										if(br == kommonitorVisualStyleHelperService.dynamicBrewBreaks[1][kommonitorVisualStyleHelperService.dynamicBrewBreaks[1].length-1]){
											return true;
										}
									}
									if(kommonitorVisualStyleHelperService.dynamicBrewBreaks[0]) {
										if(br == kommonitorVisualStyleHelperService.dynamicBrewBreaks[0][0]){
											return true;
										}
										if(br == kommonitorVisualStyleHelperService.dynamicBrewBreaks[0][kommonitorVisualStyleHelperService.dynamicBrewBreaks[0].length-1]){
											return true;
										}
									}
								}
							}
							return false;
						}

						$scope.deleteBreak = function (i, site) {
							if((kommonitorDataExchangeService.isBalanceChecked 
								|| kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
								|| $scope.containsNegativeValues)) {
								if(kommonitorDataExchangeService.isMeasureOfValueChecked) {
									kommonitorVisualStyleHelperService.manualBrew.breaks.splice(i, 1);
									$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
									$scope.updateDynamicBreaksFromManualBreaks();
								}
								else {
									kommonitorVisualStyleHelperService.dynamicBrew[site].breaks.splice(i, 1);
									let increaseBreaks = kommonitorVisualStyleHelperService.dynamicBrew[0] ? kommonitorVisualStyleHelperService.dynamicBrew[0].breaks : [];
									let decreaseBreaks = kommonitorVisualStyleHelperService.dynamicBrew[1] ? kommonitorVisualStyleHelperService.dynamicBrew[1].breaks : [];
									$rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks])
								}
							}

							else {
								kommonitorVisualStyleHelperService.manualBrew.breaks.splice(i, 1);
								$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
							}
						}

						$scope.onBreaksChanged = function (e, i, site) {
							e.currentTarget.disabled = true;
							
							let breaks = [...kommonitorVisualStyleHelperService.manualBrew.breaks];
							if(e.currentTarget.value <= breaks[0] || e.currentTarget.value >= breaks[breaks.length - 1] || breaks.includes(Number(e.currentTarget.value))) {
								e.currentTarget.value = breaks[i];
								setTimeout(function () {
									$scope.$apply(function(){
										e.currentTarget.value = breaks[i];
										kommonitorVisualStyleHelperService.manualBrew.breaks[i] = breaks[i];
									});
								}, 10);
							}
							else {
								kommonitorVisualStyleHelperService.manualBrew.breaks[i] = Number(e.currentTarget.value);
								kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
									return a - b;
								});

								$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
								
								if((kommonitorDataExchangeService.isBalanceChecked 
									|| kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
									|| $scope.containsNegativeValues)
									&& kommonitorDataExchangeService.isMeasureOfValueChecked) {
									$scope.updateDynamicBreaksFromManualBreaks();
								}
							}
						}

						$scope.onBreaksChangedDynamic = function (e, i, site) {
							e.currentTarget.disabled = true;
							
							let breaks = [...kommonitorVisualStyleHelperService.dynamicBrew[site].breaks];
							if(e.currentTarget.value <= breaks[0] || e.currentTarget.value >= breaks[breaks.length - 1] || breaks.includes(Number(e.currentTarget.value))) {
								e.currentTarget.value = breaks[i];
								setTimeout(function () {
									$scope.$apply(function(){
										e.currentTarget.value = breaks[i];
										kommonitorVisualStyleHelperService.dynamicBrew[site].breaks[i] = breaks[i];
									});
								}, 10);
							}
							else {
								kommonitorVisualStyleHelperService.dynamicBrew[site].breaks[i] = Number(e.currentTarget.value);
								kommonitorVisualStyleHelperService.dynamicBrew[site].breaks.sort(function(a, b) {
									return a - b;
								});
								$rootScope.$broadcast("changeDynamicBreaks", [kommonitorVisualStyleHelperService.dynamicBrew[0].breaks, kommonitorVisualStyleHelperService.dynamicBrew[1].breaks]);
							}
						}

						$scope.onBreakDblClick = function (e, i, site) { // todo
							if((!kommonitorDataExchangeService.isBalanceChecked 
								&& !kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
								&& !$scope.containsNegativeValues)
								|| kommonitorDataExchangeService.isMeasureOfValueChecked) {
								if (i == 0 || i == kommonitorVisualStyleHelperService.manualBrew.breaks.length-1 || $scope.breakIsUnalterable(kommonitorVisualStyleHelperService.manualBrew.breaks[i])) {
									return;
								}
							}
							else {
								if (i == 0 || i == kommonitorVisualStyleHelperService.dynamicBrew[site].breaks.length-1 || $scope.breakIsUnalterable(kommonitorVisualStyleHelperService.dynamicBrew[site].breaks[i])) {
									return;
								}
							}
							let input = e.currentTarget.children[0].children[0];
							input.disabled = false;
							input.focus();

							if (window.getSelection) {
								window.getSelection().removeAllRanges();
							} else if (document.selection) {
									document.selection.empty();
							}
						}
						
						$scope.restyleCurrentLayer = function () {
							$rootScope.$broadcast("restyleCurrentLayer", false);
						}

						$scope.getWidthForHistogramBar = function (i) {
							let colors = kommonitorVisualStyleHelperService.manualBrew.colors ? kommonitorVisualStyleHelperService.manualBrew.colors : [];
							let countArray = [];
							colors.forEach(function (color) {
								countArray.push(kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0);
							})
							return (countArray[i] / Math.max(...countArray)) * 100 || 0;
						};
						$scope.getWidthForHistogramBarMOV = function (side, i) {
							let colors = [];
							colors[0] = kommonitorVisualStyleHelperService.measureOfValueBrew[0] ? kommonitorVisualStyleHelperService.measureOfValueBrew[0].colors : [];
							colors[1] = kommonitorVisualStyleHelperService.measureOfValueBrew[1] ? kommonitorVisualStyleHelperService.measureOfValueBrew[1].colors : [];

							let countArray = [];
							colors[0].forEach(function (color) {
								countArray.push(kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0);
							});
							colors[1].forEach(function (color) {
								countArray.push(kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0);
							})
							let color = kommonitorVisualStyleHelperService.measureOfValueBrew[side].colors[i];
							let count = kommonitorVisualStyleHelperService.featuresPerColorMap.get(color);
							return (count / Math.max(...countArray)) * 100 || 0;
						};
						$scope.getWidthForHistogramBarDynamic = function (side, i) {
							let colors = [...kommonitorVisualStyleHelperService.dynamicBrew[0].colors, ...kommonitorVisualStyleHelperService.dynamicBrew[1].colors];
							let countArray = [];
							colors.forEach(function (color) {
								countArray.push(kommonitorVisualStyleHelperService.featuresPerColorMap.get(color) || 0);
							})
							let color = kommonitorVisualStyleHelperService.dynamicBrew[side].colors[i];
							let count = kommonitorVisualStyleHelperService.featuresPerColorMap.get(color);
							return (count / Math.max(...countArray)) * 100 || 0;
						};
						$scope.getHeightForBar = function (i) {
							let size = kommonitorVisualStyleHelperService.manualBrew.breaks[i+1] - kommonitorVisualStyleHelperService.manualBrew.breaks[i];
							return (size / ($scope.getMaxValue(0) - $scope.getMinValue(0))) * 100;
						};
						$scope.getHeightForBarMOV = function (site, i) {
							let size = kommonitorVisualStyleHelperService.measureOfValueBrew[site].breaks[i+1] - kommonitorVisualStyleHelperService.measureOfValueBrew[site].breaks[i];
							return (size / ($scope.getMaxValue(0) - $scope.getMinValue(1))) * 100;
						};
						$scope.getHeightForBarDynamic = function (site, i) {
							let size = kommonitorVisualStyleHelperService.dynamicBrew[site].breaks[i+1] - kommonitorVisualStyleHelperService.dynamicBrew[site].breaks[i];
							return (size / ($scope.getMaxValue(site) - $scope.getMinValue(site))) * 100;
						};
						$scope.getPercentage = function (n, site) {
							return ((n - $scope.getMinValue(site)) / ($scope.getMaxValue(site) - $scope.getMinValue(site))) * 100;
						};
						$scope.getMaxValue = function (site)  {
							let breaks = null;
							if((!kommonitorDataExchangeService.isBalanceChecked 
								&& !kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
								&& !$scope.containsNegativeValues)
								|| kommonitorDataExchangeService.isMeasureOfValueChecked) {
								breaks = kommonitorVisualStyleHelperService.manualBrew.breaks;
							}
							else {
								if (!kommonitorVisualStyleHelperService.dynamicBrew) {
									return 0;
								}
								if (!kommonitorVisualStyleHelperService.dynamicBrew[0] && !kommonitorVisualStyleHelperService.dynamicBrew[1]) {
									return 0;
								}
								if(site == 1 && (!kommonitorVisualStyleHelperService.dynamicBrew[1] || kommonitorVisualStyleHelperService.dynamicBrew[1].breaks.length < 1)) {
									breaks = kommonitorVisualStyleHelperService.dynamicBrew[0].breaks;
								}
								if(site == 0 && (!kommonitorVisualStyleHelperService.dynamicBrew[0] || kommonitorVisualStyleHelperService.dynamicBrew[0].breaks.length < 1)) {
									breaks = kommonitorVisualStyleHelperService.dynamicBrew[1].breaks;
								}
								breaks = kommonitorVisualStyleHelperService.dynamicBrew[site].breaks;
							}
							return breaks[breaks.length - 1]; 
						}
						$scope.getMinValue = function (site) {
							if((!kommonitorDataExchangeService.isBalanceChecked 
								&& !kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
								&& !$scope.containsNegativeValues)
								|| kommonitorDataExchangeService.isMeasureOfValueChecked) {
								return kommonitorVisualStyleHelperService.manualBrew.breaks[0];
							}
							if (!kommonitorVisualStyleHelperService.dynamicBrew) {
								return 0;
							}
							if (!kommonitorVisualStyleHelperService.dynamicBrew[0] && !kommonitorVisualStyleHelperService.dynamicBrew[1]) {
								return 0;
							}
							if(site == 1 && (!kommonitorVisualStyleHelperService.dynamicBrew[1] || kommonitorVisualStyleHelperService.dynamicBrew[1].breaks.length < 1)) {
								return kommonitorVisualStyleHelperService.dynamicBrew[0].breaks[0];
							}
							if(site == 0 && (!kommonitorVisualStyleHelperService.dynamicBrew[0] || kommonitorVisualStyleHelperService.dynamicBrew[0].breaks.length < 1)) {
								return kommonitorVisualStyleHelperService.dynamicBrew[1].breaks[0];
							}
							return kommonitorVisualStyleHelperService.dynamicBrew[site].breaks[0];
						}
						$scope.onBreakMouseDown = function (e, i, site) {
							$scope.isDraggingBreak = true;
							$scope.draggingBreak = e.currentTarget;
							$scope.nrOfDraggingBreak = i;
							$scope.dynamicDraggingSite = site;
						}
						$scope.onClassificationMouseUp = function () {
							$scope.isDraggingBreak = false;
						}
						$scope.onBreaksMouseMove = function (e, site) {
							if((!kommonitorDataExchangeService.isBalanceChecked 
								&& !kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
								&& !$scope.containsNegativeValues)
								|| kommonitorDataExchangeService.isMeasureOfValueChecked) {
								$scope.onBreakMouseMove(e);
							}
							else {
								$scope.onDynamicBreakMouseMove(e, site);
							}
						}
						$scope.onBreakMouseMove = function (e) {
							if ($scope.nrOfDraggingBreak != 0 && $scope.nrOfDraggingBreak != kommonitorVisualStyleHelperService.manualBrew.breaks.length-1 && !$scope.breakIsUnalterable(kommonitorVisualStyleHelperService.manualBrew.breaks[$scope.nrOfDraggingBreak])) {
								$scope.showAddBtn[0] = false;

								if(e.buttons === 1 && $scope.isDraggingBreak) {
									let histogram = document.querySelectorAll(".editableHistogram")[0];
									let newHeight = $scope.addBtnHeight[0] / histogram.offsetHeight * 100;
									if(newHeight > 0 && newHeight < 100) {
										$scope.draggingBreak.style.top = newHeight + "%";
									}

									(async () => {
										let breaks = kommonitorVisualStyleHelperService.manualBrew.breaks;
										let newBreak = Math.floor(($scope.addBtnHeight[0] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
										if (newBreak > breaks[0] && newBreak < breaks[breaks.length-1]) {
											$scope.draggingBreak.children[0].children[0].value = newBreak;
											kommonitorVisualStyleHelperService.manualBrew.breaks[$scope.nrOfDraggingBreak] = newBreak;
											kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
												return a - b;
											});
											$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
											if((kommonitorDataExchangeService.isBalanceChecked 
												|| kommonitorDataExchangeService.selectedIndicator.indicatorType.includes('DYNAMIC')
												|| $scope.containsNegativeValues) 
												&& kommonitorDataExchangeService.isMeasureOfValueChecked) {
												$scope.updateDynamicBreaksFromManualBreaks();
											}
										}
									})();
								}
							}
						};
						$scope.onDynamicBreakMouseMove = function (e, site) {
							if ($scope.nrOfDraggingBreak != 0 && $scope.nrOfDraggingBreak != kommonitorVisualStyleHelperService.dynamicBrew[$scope.dynamicDraggingSite].breaks.length-1) {
								$scope.showAddBtn[site] = false;

								if(e.buttons === 1 && $scope.isDraggingBreak) {
									let histograms = Array.from(document.querySelectorAll(".editableHistogram"));
									histograms.reverse();
									let histogram = histograms[$scope.dynamicDraggingSite];

									let newHeight = $scope.addBtnHeight[site] / histogram.offsetHeight * 100;
									if(newHeight > 0 && newHeight < 100) {
										$scope.draggingBreak.style.top = newHeight + "%";
									}

									(async () => {
										let breaks = kommonitorVisualStyleHelperService.dynamicBrew[$scope.dynamicDraggingSite].breaks;
										let newBreak = Math.floor(($scope.addBtnHeight[site] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
										if (newBreak > breaks[0] && newBreak < breaks[breaks.length-1] && !breaks.includes(newBreak)) {
											$scope.draggingBreak.children[0].children[0].value = newBreak;
											kommonitorVisualStyleHelperService.dynamicBrew[$scope.dynamicDraggingSite].breaks[$scope.nrOfDraggingBreak] = newBreak;
											kommonitorVisualStyleHelperService.dynamicBrew[$scope.dynamicDraggingSite].breaks.sort(function(a, b) {
												return a - b;
											});
											let increaseBreaks = kommonitorVisualStyleHelperService.dynamicBrew[0] ? kommonitorVisualStyleHelperService.dynamicBrew[0].breaks : [];
											let decreaseBreaks = kommonitorVisualStyleHelperService.dynamicBrew[1] ? kommonitorVisualStyleHelperService.dynamicBrew[1].breaks : [];
											$rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks]);
										}
									})();
								}
							}
						}
					}
				]
			}
		);