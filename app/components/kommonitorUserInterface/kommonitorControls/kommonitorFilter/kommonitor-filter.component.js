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

							$scope.rangeSliderForFilter;
							$scope.minValue;
							$scope.maxValue;

							$scope.$on("updateIndicatorValueRangeFilter", function (event, date) {

									$scope.setupRangeSliderForFilter(date);

							});

							function dateToTS (date) {
					        return date.valueOf();
					    }

					    function tsToDate (ts) {
					        var d = new Date(ts);

					        return d.toLocaleDateString("de-DE", {
					            year: 'numeric',
					            month: 'long',
					            day: 'numeric'
					        });
					    }

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

								var geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;

								// initialize and fill in loop
								$scope.minValue = geoJSON.features[0].properties[date];
								$scope.maxValue = $scope.minValue;

								geoJSON.features.forEach(function(feature){

									if(feature.properties[date] < $scope.minValue){
										$scope.minValue = feature.properties[date]
									}
									else if(feature.properties[date] > $scope.maxValue){
										$scope.maxValue = feature.properties[date]
									}
								});

								$scope.minValue = +$scope.minValue.toFixed(numberOfDecimals);
								$scope.maxValue = +$scope.maxValue.toFixed(numberOfDecimals);

								$("#rangeSliderForFiltering").ionRangeSlider({
										skin: "big",
						        type: "double",
						        min: $scope.minValue,
						        max: $scope.maxValue,
						        from: $scope.minValue,
						        to: $scope.maxValue,
								   	force_edges: true,
										step: 0.0001,
						        grid: true,
										prettify_enabled: true,
										prettify_separator: "",
										onChange: onChangeRangeFilter
						    });

								$scope.rangeSliderForFilter = $("#rangeSliderForFiltering").data("ionRangeSlider");
								// make sure that tha handles are properly set to man and max values
								$scope.rangeSliderForFilter.update({
						        from: $scope.minValue,
						        to: $scope.maxValue
						    });
								// $("#rangeSliderForFiltering").ionRangeSlider({
						    //     skin: "big",
						    //     type: "double",
						    //     grid: true,
						    //     min: dateToTS(new Date(2000, 10, 1)),
						    //     max: dateToTS(new Date(2018, 11, 1)),
						    //     from: dateToTS(new Date(205, 10, 8)),
						    //     to: dateToTS(new Date(2014, 10, 23)),
								// 		force_edges: true,
								// 		step: 86400000*30,
						    //     prettify: tsToDate
						    // });

							};

							function onChangeRangeFilter (data) {
								// Called every time handle position is changed
								kommonitorDataExchangeService.rangeFilterData = data;

								if(!kommonitorDataExchangeService.filteredIndicatorFeatureNames){
									kommonitorDataExchangeService.filteredIndicatorFeatureNames = [];
								}

								var date = INDICATOR_DATE_PREFIX + kommonitorDataExchangeService.selectedDate;
								var geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;

								geoJSON.features.forEach(function(feature){
									var value = +Number(feature.properties[date]).toFixed(numberOfDecimals);

									if(value >= data.from && value <= data.to){
										// feature must not be filtered - make sure it is not marked as filtered
										if (kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(feature.properties.spatialUnitFeatureName)){
											var index = kommonitorDataExchangeService.filteredIndicatorFeatureNames.indexOf(feature.properties.spatialUnitFeatureName);
											kommonitorDataExchangeService.filteredIndicatorFeatureNames.splice(index, 1);
										}
									}
									else{
										// feature must be filtered
										if (!kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(feature.properties.spatialUnitFeatureName)){
											kommonitorDataExchangeService.filteredIndicatorFeatureNames.push(feature.properties.spatialUnitFeatureName);
										}
									}

								});

								kommonitorMapService.restyleCurrentLayer();
							};

					}]
				});
