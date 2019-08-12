angular
		.module('kommonitorFilter')
		.component(
				'kommonitorFilter',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorFilter/kommonitor-filter.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', '__env', function kommonitorFilterController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, __env) {

							const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
							this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
							this.kommonitorMapServiceInstance = kommonitorMapService;
							var numberOfDecimals = __env.numberOfDecimals;
							// initialize any adminLTE box widgets
							$('.box').boxWidget();

							$scope.rangeSliderForFilter;
							$scope.valueRangeMinValue;
							$scope.valueRangeMaxValue;
							$scope.geoJSON;

							//measureOfValue stuff
							$scope.movMinValue;
							$scope.movMaxValue;
							$scope.movMiddleValue;
							$scope.movStep;
							$scope.movRangeSlider;

							$scope.inputNotValid = false;

							$scope.$on("updateIndicatorValueRangeFilter", function (event, date) {

									$scope.setupRangeSliderForFilter(date);

							});

							$scope.setupRangeSliderForFilter = function(date){
								date = INDICATOR_DATE_PREFIX + date;

								if($scope.rangeSliderForFilter){
									kommonitorDataExchangeService.rangeFilterData = undefined;
									$scope.rangeSliderForFilter.destroy();

									var domNode = document.getElementById("rangeSliderForFiltering");

									while (domNode.hasChildNodes()) {
									  domNode.removeChild(domNode.lastChild);
									}
								}

								$scope.geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;
								if(kommonitorDataExchangeService.isBalanceChecked){
									//we have to use the geoJSON of balance mode
									try{
										$scope.geoJSON = kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON;
									}catch(err){
										$scope.geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;
									}

								}

								var values = [];

								$scope.geoJSON.features.forEach(function(feature){
									// if (feature.properties[date] > movMaxValue)
									// 	movMaxValue = feature.properties[date];
									//
									// else if (feature.properties[date] < movMinValue)
									// 	movMinValue = feature.properties[date];

									if(! kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[date])){
											values.push(feature.properties[date]);
									}
								});

								//sort ascending order
								values.sort(function(a, b){return a-b});

								// initialize and fill in loop
								$scope.valueRangeMinValue = values[0];
								$scope.valueRangeMaxValue = values[values.length - 1];

								$scope.valueRangeMinValue = +$scope.valueRangeMinValue.toFixed(numberOfDecimals);
								$scope.valueRangeMaxValue = +$scope.valueRangeMaxValue.toFixed(numberOfDecimals);

								$("#rangeSliderForFiltering").ionRangeSlider({
										skin: "big",
						        type: "double",
						        min: $scope.valueRangeMinValue,
						        max: $scope.valueRangeMaxValue,
						        from: $scope.valueRangeMinValue,
						        to: $scope.valueRangeMaxValue,
								   	force_edges: true,
										step: 0.01,
						        grid: true,
										prettify_enabled: true,
										prettify_separator: "",
										onChange: onChangeRangeFilter
						    });

								$scope.rangeSliderForFilter = $("#rangeSliderForFiltering").data("ionRangeSlider");
								// make sure that tha handles are properly set to man and max values
								$scope.rangeSliderForFilter.update({
						        from: $scope.valueRangeMinValue,
						        to: $scope.valueRangeMaxValue
						    });

							};

							function onChangeRangeFilter (data) {
								// Called every time handle position is changed
								kommonitorDataExchangeService.rangeFilterData = data;

								if(!kommonitorDataExchangeService.filteredIndicatorFeatureNames){
									kommonitorDataExchangeService.filteredIndicatorFeatureNames = [];
								}

								var date = INDICATOR_DATE_PREFIX + kommonitorDataExchangeService.selectedDate;

								$scope.geoJSON.features.forEach(function(feature){
									var value = +Number(feature.properties[date]).toFixed(numberOfDecimals);

									if(value >= data.from && value <= data.to){
										// feature must not be filtered - make sure it is not marked as filtered
										if (kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME])){
											var index = kommonitorDataExchangeService.filteredIndicatorFeatureNames.indexOf(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME]);
											kommonitorDataExchangeService.filteredIndicatorFeatureNames.splice(index, 1);
										}
									}
									else{
										// feature must be filtered
										if (!kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME])){
											kommonitorDataExchangeService.filteredIndicatorFeatureNames.push(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME]);
										}
									}

								});

								kommonitorMapService.restyleCurrentLayer();
							};




							// MeasureOfValue stuff
							$scope.inputNotValid = false;


							this.onChangeUseMeasureOfValue = function(){
								if(kommonitorDataExchangeService.isBalanceChecked){
									$rootScope.$broadcast("DisableBalance");
									$rootScope.$broadcast("updateIndicatorValueRangeFilter", kommonitorDataExchangeService.selectedDate);
									//replace displayed indicator on map
									kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedDate, true);
								}
								else{
									this.kommonitorMapServiceInstance.restyleCurrentLayer();
								}

							};

							$scope.$on("updateMeasureOfValueBar", function (event, date) {

									$scope.updateMeasureOfValueBar(date);

							});

							$scope.updateMeasureOfValueBar = function(date){

								//append date prefix to access correct property!
								date = INDICATOR_DATE_PREFIX + date;
								var geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;

								// var measureOfValueInput = document.getElementById("measureOfValueInput");

								var values = [];

								geoJSON.features.forEach(function(feature){
									// if (feature.properties[date] > movMaxValue)
									// 	movMaxValue = feature.properties[date];
									//
									// else if (feature.properties[date] < movMinValue)
									// 	movMinValue = feature.properties[date];

									if(! kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[date])){
											values.push(feature.properties[date]);
									}
								});

								//sort ascending order
								values.sort(function(a, b){return a-b});

								$scope.movMinValue = +Number(values[0]).toFixed(numberOfDecimals);
								$scope.movMaxValue = +Number(values[values.length - 1]).toFixed(numberOfDecimals);

								$scope.movMiddleValue = +(($scope.movMaxValue + $scope.movMinValue) / 2).toFixed(numberOfDecimals);
								// $scope.movStep = +(($scope.movMaxValue - $scope.movMinValue)/35).toFixed(numberOfDecimals);
								$scope.movStep = 0.01;

								// measureOfValueInput.setAttribute("min", $scope.movMinValue);
								// measureOfValueInput.setAttribute("max", $scope.movMaxValue);
								// measureOfValueInput.setAttribute("movStep", $scope.movStep);
								// measureOfValueInput.setAttribute("value", $scope.movMiddleValue);

								kommonitorDataExchangeService.measureOfValue = $scope.movMiddleValue;

								var measureOfValueTextInput = document.getElementById("measureOfValueTextInput");
								measureOfValueTextInput.setAttribute("min", $scope.movMinValue);
								measureOfValueTextInput.setAttribute("max", $scope.movMaxValue);
								measureOfValueTextInput.setAttribute("value", $scope.movMiddleValue);
								measureOfValueTextInput.setAttribute("step", $scope.movStep);

								if($scope.movRangeSlider){
									$scope.movRangeSlider.destroy();

									var domNode = document.getElementById("measureOfValueInput");

									while (domNode.hasChildNodes()) {
									  domNode.removeChild(domNode.lastChild);
									}
								}

								// rangeSLider
								$("#measureOfValueInput").ionRangeSlider({
										skin: "big",
						        type: "single",
						        min: $scope.movMinValue,
						        max: $scope.movMaxValue,
						        from: $scope.movMiddleValue,
								   	force_edges: true,
										step: 0.01,
						        grid: true,
										prettify_enabled: true,
										prettify_separator: "",
										onChange: $scope.onMeasureOfValueChange
						    });

								$scope.movRangeSlider = $("#measureOfValueInput").data("ionRangeSlider");
								// make sure that tha handles are properly set to man and max values
								$scope.movRangeSlider.update({
						        from: $scope.movMiddleValue
						    });

								$scope.inputNotValid = false;

							};

							$scope.onMeasureOfValueChange = function(data){

								kommonitorDataExchangeService.measureOfValue = +Number(data.from).toFixed(numberOfDecimals);

								// kommonitorDataExchangeService.measureOfValue = +Number(kommonitorDataExchangeService.measureOfValue).toFixed(numberOfDecimals);

								if(kommonitorDataExchangeService.measureOfValue >= $scope.movMinValue && kommonitorDataExchangeService.measureOfValue <= $scope.movMaxValue){
									$scope.inputNotValid = false;
									kommonitorMapService.restyleCurrentLayer();
								}
								else{
									$scope.inputNotValid = true;
								}

							};

							$scope.onMeasureOfValueChangeByText = function(){

								kommonitorDataExchangeService.measureOfValue = +Number(kommonitorDataExchangeService.measureOfValue).toFixed(numberOfDecimals);

								// kommonitorDataExchangeService.measureOfValue = +Number(kommonitorDataExchangeService.measureOfValue).toFixed(numberOfDecimals);

								if(kommonitorDataExchangeService.measureOfValue >= $scope.movMinValue && kommonitorDataExchangeService.measureOfValue <= $scope.movMaxValue){
									$scope.inputNotValid = false;
									$scope.movRangeSlider.update({
							        from: kommonitorDataExchangeService.measureOfValue
							    });
									kommonitorMapService.restyleCurrentLayer();
								}
								else{
									$scope.inputNotValid = true;
								}

							};

					}]
				});
