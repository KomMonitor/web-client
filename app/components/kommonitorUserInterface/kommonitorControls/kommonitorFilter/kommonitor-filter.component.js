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
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', 'kommonitorFilterHelperService', 
					'__env', '$http', function kommonitorFilterController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, 
						kommonitorFilterHelperService, __env, $http) {

							const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
							this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
							this.kommonitorMapServiceInstance = kommonitorMapService;
							this.kommonitorFilterHelperServiceInstance = kommonitorFilterHelperService;
							var numberOfDecimals = __env.numberOfDecimals;
							// initialize any adminLTE box widgets
							$('.box').boxWidget();

							$scope.kommonitorFilterModes = __env.filterModes;

							$scope.considerAllowedSpatialUnitsOfCurrentIndicator = true;
							$scope.loadingData = false;

							$scope.rangeSliderForFilter;
							$scope.valueRangeMinValue;
							$scope.valueRangeMaxValue;
							$scope.currentLowerFilterValue;
							$scope.currentHigherFilterValue;
							$scope.lowerFilterInputNotValid = false;
							$scope.higherFilterInputNotValid = false;
							$scope.indicatorMetadataAndGeoJSON;

							$scope.inputLowerFilterValue;
							$scope.inputHigherFilterValue;

							//measureOfValue stuff
							$scope.movMinValue;
							$scope.movMaxValue;
							$scope.movMiddleValue;
							$scope.movStep;
							$scope.movRangeSlider;

							// SPATIAL FILTER STUFF
							$scope.selectedSpatialUnitForFilter;
							$scope.higherSpatialUnits = undefined;
							$scope.higherSpatialUnitFilterFeatureGeoJSON;
							$scope.reappliedFilter = false;

							$scope.selectionByFeatureSpatialFilterDuallistOptions = {
								title: {label: 'Gebiete', helpMessage: 'help'},
								selectOptions: {initialText: "Gebiete"},
								items: [],
								button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
								selectedItems: []
							};

							$scope.manualSelectionSpatialFilterDuallistOptions = {
								title: {label: 'Gebiete', helpMessage: 'help'},
								selectOptions: {initialText: "Gebiete"},
								items: [],
								button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
								selectedItems: []
							};

							$scope.isFilterModeActive = function(id) {
								return $scope.kommonitorFilterModes.indexOf(id) !== -1;
							}


							$scope.setupSpatialUnitFilter = function(indicatorMetadataAndGeoJSON, spatialUnitName, date){
								
								$scope.loadingData = true;
								
								let allowedSpatialUnitIds = indicatorMetadataAndGeoJSON.applicableSpatialUnits.map(spatialUnitEntry => {									
									return spatialUnitEntry.spatialUnitId;									
								});
								
								$scope.higherSpatialUnits = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableSpatialUnits));
								
								// only show those spatial units that are actually visible according to keycloak role
								// and associated to the current indicator as well
								for (let index = 0; index < $scope.higherSpatialUnits.length; index++) {
									const spatialUnitMetadata = $scope.higherSpatialUnits[index];
									
									// remove if it is not applicable for current indicator OR
									// remove if it is the currently displayed spatial unit to show only hierarchically higher spatial units
									if($scope.considerAllowedSpatialUnitsOfCurrentIndicator && ! allowedSpatialUnitIds.includes(spatialUnitMetadata.spatialUnitId)){	
										
										// only remove the current element
										// which represents a spatial unit that is 
										// not supported by the current indicator 
										$scope.higherSpatialUnits.splice(index, 1);
									}

									// since we query through a hierarchically sorted array of ALL spatial units
									// we have to stop when we identify the currently displayed spatial unit
									// in that case we have to remove that from the list of upper  
									if (spatialUnitName == spatialUnitMetadata.spatialUnitLevel){
										// remove current all all remaining elements from array
										// (which are lower hierarchy spatial units)
										$scope.higherSpatialUnits.splice(index);
										break;
									}
								}

								// $scope.higherSpatialUnits.splice(targetIndex);
								$scope.selectedSpatialUnitForFilter = $scope.higherSpatialUnits[$scope.higherSpatialUnits.length - 1];

								$scope.loadingData = false;
							};

							$scope.inputNotValid = false;

							$scope.$on("onChangeSelectedIndicator", function(event){
								$scope.reappliedFilter = false;
							});

							$scope.$on("indicatortMapDisplayFinished", function(){
								// trigger the continous display of current filter									
								if(! $scope.reappliedFilter){
									$scope.reappliedFilter = true;
									if ($scope.showSelectionByFeatureSpatialFilter){
										$scope.onSelectionByFeatureSpatialFilterSelectBtnPressed();
									}
									if ($scope.showManualSelectionSpatialFilter){
										$scope.onManualSelectionBySelectedMapFeaturesBtnPressed();
									}										
								}	
							});

							$scope.$on("replaceIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation) {

								$scope.setupSpatialUnitFilter(indicatorMetadataAndGeoJSON, spatialUnitName, date);

								if(! $scope.previouslySelectedIndicator){
									$scope.previouslySelectedIndicator = kommonitorDataExchangeService.selectedIndicator;
								}
								if(! $scope.previouslySelectedSpatialUnit){
									$scope.previouslySelectedSpatialUnit = kommonitorDataExchangeService.selectedSpatialUnit;
								}

								// if($scope.previouslySelectedIndicator.indicatorId != indicatorMetadataAndGeoJSON.indicatorId || $scope.previouslySelectedSpatialUnit.spatialUnitLevel != spatialUnitName){
								if($scope.previouslySelectedSpatialUnit.spatialUnitLevel != spatialUnitName){
									// reset filter component
									if ($scope.showSelectionByFeatureSpatialFilter)
										$scope.updateSelectableAreas("byFeature");
										kommonitorFilterHelperService.clearFilteredFeatures();
										kommonitorFilterHelperService.clearSelectedFeatures();
									if ($scope.showManualSelectionSpatialFilter)
										$scope.updateSelectableAreas("manual");
										kommonitorFilterHelperService.clearFilteredFeatures();
										kommonitorFilterHelperService.clearSelectedFeatures();
								}

								$scope.previouslySelectedIndicator = kommonitorDataExchangeService.selectedIndicator;
								$scope.previouslySelectedSpatialUnit = kommonitorDataExchangeService.selectedSpatialUnit;
								
							});

							$scope.$on("updateIndicatorValueRangeFilter", function (event, date, indicatorMetadataAndGeoJSON) {

									$scope.setupRangeSliderForFilter(date, indicatorMetadataAndGeoJSON);

							});

							$scope.setupRangeSliderForFilter = function(date, indicatorMetadataAndGeoJSON){
								date = INDICATOR_DATE_PREFIX + date;

								if($scope.rangeSliderForFilter){
									kommonitorDataExchangeService.rangeFilterData = undefined;
									$scope.rangeSliderForFilter.destroy();

									var domNode = document.getElementById("rangeSliderForFiltering");

									while (domNode.hasChildNodes()) {
									  domNode.removeChild(domNode.lastChild);
									}
								}

								$scope.indicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;

								var values = [];

								$scope.indicatorMetadataAndGeoJSON.geoJSON.features.forEach(function(feature){
									// if (feature.properties[date] > movMaxValue)
									// 	movMaxValue = feature.properties[date];
									//
									// else if (feature.properties[date] < movMinValue)
									// 	movMinValue = feature.properties[date];

									if(! kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[date])){
											values.push(feature.properties[date]);
									}
								});

								if(values.length === 0){
									console.warn("Filter range slider cannot be created, as there is no valid indicator value on the selected dataset for the selected date.");
									return ;
								}

								//sort ascending order
								values.sort(function(a, b){return a-b});

								// initialize and fill in loop
								$scope.valueRangeMinValue = values[0];
								$scope.valueRangeMaxValue = values[values.length - 1];

								$scope.valueRangeMinValue = kommonitorDataExchangeService.getIndicatorValue_asNumber($scope.valueRangeMinValue);
								$scope.valueRangeMaxValue = kommonitorDataExchangeService.getIndicatorValue_asNumber($scope.valueRangeMaxValue);

								$scope.currentLowerFilterValue = $scope.valueRangeMinValue;
								$scope.currentHigherFilterValue = $scope.valueRangeMaxValue;

								$scope.inputLowerFilterValue = $scope.valueRangeMinValue;
								$scope.inputHigherFilterValue = $scope.valueRangeMaxValue;

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
								// make sure that the handles are properly set to min and max values
								$scope.rangeSliderForFilter.update({
						        from: $scope.valueRangeMinValue,
						        to: $scope.valueRangeMaxValue
						    });

							};

							$scope.onChangeLowerFilterValue = function(value){

								$scope.inputLowerFilterValue = value;

								if(($scope.inputLowerFilterValue >= $scope.valueRangeMinValue) && ($scope.inputLowerFilterValue <= $scope.valueRangeMaxValue) && ($scope.inputLowerFilterValue <= $scope.inputHigherFilterValue)){	
									$scope.currentLowerFilterValue = $scope.inputLowerFilterValue;
									$scope.lowerFilterInputNotValid = false;
									$scope.rangeSliderForFilter.update({
											from: $scope.currentLowerFilterValue,
											to: $scope.currentHigherFilterValue
									});

									$scope.applyRangeFilter();
								}
								else{
									$scope.lowerFilterInputNotValid = true;
								}
							};

							$scope.onChangeHigherFilterValue = function(value){

								$scope.inputHigherFilterValue = value;

								if(($scope.inputHigherFilterValue <= $scope.valueRangeMaxValue) && ($scope.inputHigherFilterValue >= $scope.valueRangeMinValue) && ($scope.inputLowerFilterValue <= $scope.inputHigherFilterValue)){
									$scope.currentHigherFilterValue = $scope.inputHigherFilterValue;
									$scope.higherFilterInputNotValid = false;
									$scope.rangeSliderForFilter.update({
											from: $scope.currentLowerFilterValue,
											to: $scope.currentHigherFilterValue
									});

									$scope.applyRangeFilter();
								}
								else{
									$scope.higherFilterInputNotValid = true;
								}
							};

							function onChangeRangeFilter (data) {
								// Called every time handle position is changed
								kommonitorDataExchangeService.rangeFilterData = data;

								$scope.lowerFilterInputNotValid = false;
								$scope.higherFilterInputNotValid = false;

								$scope.currentLowerFilterValue = data.from;
								$scope.inputLowerFilterValue = data.from;

								document.getElementById('inputLowerValue').value = $scope.inputLowerFilterValue;

								$scope.currentHigherFilterValue = data.to;
								$scope.inputHigherFilterValue = data.to;

								document.getElementById('inputHigherValue').value = $scope.inputHigherFilterValue;

								$scope.applyRangeFilter();
							};

							$scope.applyRangeFilter = function(){

								var dateProperty = INDICATOR_DATE_PREFIX + kommonitorDataExchangeService.selectedDate;

								kommonitorFilterHelperService.applyRangeFilter($scope.indicatorMetadataAndGeoJSON.geoJSON.features, dateProperty, $scope.currentLowerFilterValue, $scope.currentHigherFilterValue);

								$scope.$digest();
							}


							// MeasureOfValue stuff
							$scope.inputNotValid = false;


							this.onChangeUseMeasureOfValue = function(){
								if(kommonitorDataExchangeService.isBalanceChecked){
									$rootScope.$broadcast("DisableBalance");
									$rootScope.$broadcast("updateIndicatorValueRangeFilter", kommonitorDataExchangeService.selectedDate, kommonitorDataExchangeService.selectedIndicator);
									//replace displayed indicator on map
									kommonitorFilterHelperService.filterAndReplaceDataset();
									// kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedDate, true);
								}
								else{
									this.kommonitorMapServiceInstance.restyleCurrentLayer();
								}

							};

							$scope.$on("updateMeasureOfValueBar", function (event, date, indicatorMetadataAndGeoJSON) {

									$scope.updateMeasureOfValueBar(date, indicatorMetadataAndGeoJSON);

							});

							$scope.updateMeasureOfValueBar = function(date, indicatorMetadataAndGeoJSON){

								//append date prefix to access correct property!
								date = INDICATOR_DATE_PREFIX + date;
								var geoJSON = indicatorMetadataAndGeoJSON.geoJSON;

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
								// make sure that the handles are properly set to min and max values
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

							$scope.updateSelectableAreas = async function(selectionType) {
								$scope.loadingData = true;
								//send request to datamanagement API
								let selectedSpatialUnit = kommonitorDataExchangeService.selectedSpatialUnit;
								let selectedSpatialUnitId = selectedSpatialUnit.spatialUnitId;
								let upperSpatialUnitId = undefined;
								
								// spatial filter not applicable since no upper spatial unit is available or selected
								if(! $scope.selectedSpatialUnitForFilter){
									$scope.loadingData = false;
									return;
								}

								if (selectionType === "byFeature" && $scope.selectedSpatialUnitForFilter) {									
									upperSpatialUnitId = $scope.selectedSpatialUnitForFilter.spatialUnitId;																		
								}
								let selectedIndicatorId = kommonitorDataExchangeService.selectedIndicator.indicatorId;

								// example: 2020-12-31
								let selectedDateComponents = kommonitorDataExchangeService.selectedDate.split("-");

								//build request
								let datePath = "";
								if(selectedDateComponents && selectedDateComponents.length && selectedDateComponents.length == 3){
									datePath = selectedDateComponents[0] + "/" + selectedDateComponents[1] + "/" + selectedDateComponents[2];
								}
								else{
									// fallback option, if no valid date could be used
									datePath = "allFeatures";
								}
								let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
									"/spatial-units/" + selectedSpatialUnitId + "/" + datePath;
								
								if (selectionType === "byFeature" && upperSpatialUnitId)
									url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
									"/spatial-units/" + upperSpatialUnitId + "/" + datePath;
								//send request
								console.log(url);
								await $http({
									url: url,
									method: "GET"
								}).then(function successCallback(response) { //TODO add error callback for the case that the combination of indicator and nextUpperHierarchyLevel doesn't exist
									let areaNames = [];
									$(response.data.features).each( (id, obj) => {
										areaNames.push({name: obj.properties[__env.FEATURE_NAME_PROPERTY_NAME], id: obj.properties[__env.FEATURE_ID_PROPERTY_NAME]});
									});
									if (selectionType === "manual") {
										$scope.manualSelectionSpatialFilterDuallistOptions.selectedItems = [];
										let dataArray = kommonitorDataExchangeService.createDualListInputArray(areaNames, "name", "id");
										$scope.manualSelectionSpatialFilterDuallistOptions.items = dataArray;
									}
									if (selectionType === "byFeature") {
										$scope.higherSpatialUnitFilterFeatureGeoJSON = response.data;
										$scope.selectionByFeatureSpatialFilterDuallistOptions.selectedItems = [];
										let dataArray = kommonitorDataExchangeService.createDualListInputArray(areaNames, "name", "id");
										$scope.selectionByFeatureSpatialFilterDuallistOptions.items = dataArray;
									}
									$scope.loadingData = false;
									$scope.$digest();
								});
							};

							$scope.onChangeShowManualSelection = async function() {
								// return if toggle was deactivated
								if(!$scope.showManualSelectionSpatialFilter)
									$scope.onManualSelectionSpatialFilterResetBtnPressed();						
								else {
									$scope.showSelectionByFeatureSpatialFilter = false;
									$scope.onManualSelectionSpatialFilterResetBtnPressed();								
								}
							};

							$scope.onChangeShowSelectionByFeature = async function() {
								// return if toggle was deactivated
								if(!$scope.showSelectionByFeatureSpatialFilter)
									$scope.onSelectionByFeatureSpatialFilterResetBtnPressed();
								else {
									$scope.showManualSelectionSpatialFilter = false;
									$scope.onSelectionByFeatureSpatialFilterResetBtnPressed();								
								}
							};

							$scope.onChangeSelectedSpatialUnitForFilter = function(){
								if ($scope.showSelectionByFeatureSpatialFilter)
									$scope.updateSelectableAreas("byFeature");

								if($scope.showManualSelectionSpatialFilter){
									$scope.updateSelectableAreas("manual");
								}
							};

							$scope.onSelectionByFeatureSpatialFilterSelectBtnPressed = function(){
								if($scope.selectionByFeatureSpatialFilterDuallistOptions.selectedItems && $scope.selectionByFeatureSpatialFilterDuallistOptions.selectedItems.length > 0){
									// objects like {category: category, name:name}									
									//$scope.selectionByFeatureSpatialFilterDuallistOptions.selectedItems
									let targetFeatureNames = $scope.selectionByFeatureSpatialFilterDuallistOptions.selectedItems.map(object => object.name);

									kommonitorFilterHelperService.applySpatialFilter_higherSpatialUnitFeatures($scope.higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames);
								}
							};

							$scope.onSelectionByFeatureSpatialFilterResetBtnPressed = function(){
								$scope.updateSelectableAreas("byFeature");

								kommonitorFilterHelperService.clearFilteredFeatures();
								kommonitorFilterHelperService.filterAndReplaceDataset();
								if(document.getElementById('controlNoDataDisplay').checked)
									$rootScope.$broadcast('applyNoDataDisplay')	
							};

							$scope.onManualSelectionSpatialFilterSelectBtnPressed = function(){
								if($scope.manualSelectionSpatialFilterDuallistOptions.selectedItems && $scope.manualSelectionSpatialFilterDuallistOptions.selectedItems.length > 0){
									// objects like {category: category, name:name}									
									//$scope.manualSelectionSpatialFilterDuallistOptions.selectedItems
									let targetFeatureNames = $scope.manualSelectionSpatialFilterDuallistOptions.selectedItems.map(object => object.name);

									kommonitorFilterHelperService.applySpatialFilter_currentSpatialUnitFeatures(targetFeatureNames);
								}
							};

							$scope.onManualSelectionSpatialFilterResetBtnPressed = function(){
								$scope.updateSelectableAreas("manual");

								kommonitorFilterHelperService.clearFilteredFeatures();
								kommonitorFilterHelperService.filterAndReplaceDataset();
								if(document.getElementById('controlNoDataDisplay').checked)
									$rootScope.$broadcast('applyNoDataDisplay')	
							};

							$scope.onManualSelectionBySelectedMapFeaturesBtnPressed = function(){
								// manage duallist items display
								$scope.manageManualDualList_fromMapSelection();
								
								// apply spatial filter from selected map features
								$scope.onManualSelectionSpatialFilterSelectBtnPressed();
							};

							$scope.manageManualDualList_fromMapSelection = function(){
								$scope.manualSelectionSpatialFilterDuallistOptions.items = $scope.manualSelectionSpatialFilterDuallistOptions.items.concat($scope.manualSelectionSpatialFilterDuallistOptions.selectedItems);
								$scope.manualSelectionSpatialFilterDuallistOptions.selectedItems = [];

								$scope.manualSelectionSpatialFilterDuallistOptions.selectedItems = $scope.manualSelectionSpatialFilterDuallistOptions.items.filter(item => kommonitorFilterHelperService.featureIsCurrentlySelected(item.id));								
								$scope.manualSelectionSpatialFilterDuallistOptions.items = $scope.manualSelectionSpatialFilterDuallistOptions.items.filter(item => ! kommonitorFilterHelperService.featureIsCurrentlySelected(item.id));								
							};

							// $rootScope.$on("changeSpatialUnit", function() {
							// 	if ($scope.showSelectionByFeatureSpatialFilter)
							// 		$scope.updateSelectableAreas("byFeature");
							// 	if ($scope.showManualSelectionSpatialFilter)
							// 		$scope.updateSelectableAreas("manual");
							// });

							//TODO on indicator change

					}]
				});
