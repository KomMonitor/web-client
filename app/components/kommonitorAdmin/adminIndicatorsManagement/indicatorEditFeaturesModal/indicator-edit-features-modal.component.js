angular.module('indicatorEditFeaturesModal').component('indicatorEditFeaturesModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function IndicatorEditFeaturesModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
	
			/*	PUT BODY
				{
					"indicatorValues": [
						{
						"spatialReferenceKey": "spatialReferenceKey",
						"valueMapping": [
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							},
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							}
						]
						},
						{
						"spatialReferenceKey": "spatialReferenceKey",
						"valueMapping": [
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							},
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							}
						]
						}
					],
					"applicableSpatialUnit": "applicableSpatialUnit",
					"defaultClassificationMapping": {
						"colorBrewerSchemeName": "colorBrewerSchemeName",
						"items": [
						{
							"defaultCustomRating": "defaultCustomRating",
							"defaultColorAsHex": "defaultColorAsHex"
						},
						{
							"defaultCustomRating": "defaultCustomRating",
							"defaultColorAsHex": "defaultColorAsHex"
						}
						]
					}
					}
			*/
	
			//Date picker
			$('#indicatorEditFeaturesDirectTimestampDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

	
			$scope.indicatorFeaturesJSON;
			$scope.currentIndicatorDataset;
			$scope.remainingFeatureHeaders;

			$scope.overviewTableTargetSpatialUnitMetadata = undefined;
	
			$scope.spatialUnitRefKeyProperty = undefined;
			$scope.targetSpatialUnitMetadata = undefined;
			$scope.tmpTimeseriesMapping_indicatorValuesPropertyName = undefined;
			$scope.useTimeseriesAsProperty = false;
			$scope.tmpTimeseriesMapping_timestampPropertyName = undefined;
			$scope.tmpTimeseriesMapping_directTimestamp = undefined;
			$scope.timeseriesMappings_adminView = [];

			$scope.converter = undefined;
			$scope.schema = undefined;
			$scope.datasourceType = undefined;
			$scope.indicatorDataSourceIdProperty = undefined;
			$scope.indicatorDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.putBody_indicators = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$scope.importerErrors = undefined;

			$scope.loadingData = false;

	
			$scope.$on("onEditIndicatorFeatures", function (event, indicatorDataset) {
	
				if($scope.currentIndicatorDataset && $scope.currentIndicatorDataset.indicatorName === indicatorDataset.indicatorName){
					return;
				}
				else{
					$scope.currentIndicatorDataset = indicatorDataset;
	
					// $scope.refreshIndicatorEditFeaturesOverviewTable();
	
					$scope.resetIndicatorEditFeaturesForm();
				}
	
			});

			$scope.filterOverviewTargetSpatialUnits = function(){
				return function( spatialUnitMetadata ) {
					if($scope.currentIndicatorDataset){
						var isIncluded = $scope.currentIndicatorDataset.applicableSpatialUnits.includes(spatialUnitMetadata.spatialUnitLevel);
						return isIncluded;
					}
				  };
			};
	
			$scope.refreshIndicatorEditFeaturesOverviewTable = function(){
	
				$scope.loadingData = true;
				// fetch all indicator features
				$http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + $scope.overviewTableTargetSpatialUnitMetadata.spatialUnitId + "/without-geometry",
					method: "GET",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {
	
					$scope.indicatorFeaturesJSON = response.data;
	
					var tmpRemainingHeaders = [];
	
					for (var property in $scope.indicatorFeaturesJSON[0]){
						if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME){
							tmpRemainingHeaders.push(property);
						}
					}
	
					$scope.remainingFeatureHeaders = tmpRemainingHeaders;
	
						$scope.loadingData = false;
	
					}, function errorCallback(response) {
						$scope.errorMessagePart = response;
	
						$("#indicatorEditFeaturesErrorAlert").show();
						$scope.loadingData = false;
				});
			};
	
			$scope.clearAllIndicatorFeatures = function(){
				$scope.loadingData = true;
				// delete all indicator features for target spatial unit
				$http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + $scope.overviewTableTargetSpatialUnitMetadata.spatialUnitId,
					method: "DELETE",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {
	
					$scope.indicatorFeaturesJSON = undefined;
					$scope.remainingFeatureHeaders = undefined;
	
					$rootScope.$broadcast("refreshIndicatorOverviewTable");
					// $scope.refreshIndicatorEditFeaturesOverviewTable();
	
					$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;
	
					$("#indicatorEditFeaturesSuccessAlert").show();
					$scope.loadingData = false;
	
					}, function errorCallback(response) {
						$scope.errorMessagePart = response;
	
						$("#indicatorEditFeaturesErrorAlert").show();
						$scope.loadingData = false;
				});
			};
	
			$scope.resetIndicatorEditFeaturesForm = function(){
	
				$scope.indicatorFeaturesJSON = undefined;
				$scope.remainingFeatureHeaders = undefined;

				$scope.overviewTableTargetSpatialUnitMetadata = undefined;
				for (const spatialUnitMetadataEntry of kommonitorDataExchangeService.availableSpatialUnits) {
					if($scope.currentIndicatorDataset.applicableSpatialUnits.includes(spatialUnitMetadataEntry.spatialUnitLevel)){
						$scope.overviewTableTargetSpatialUnitMetadata = spatialUnitMetadataEntry;
						break;
					}					
				}
	
				$scope.spatialUnitRefKeyProperty = undefined;
				$scope.targetSpatialUnitMetadata = undefined;
				$scope.tmpTimeseriesMapping_indicatorValuesPropertyName = undefined;
				$scope.useTimeseriesAsProperty = false;
				$scope.tmpTimeseriesMapping_timestampPropertyName = undefined;
				$scope.tmpTimeseriesMapping_directTimestamp = undefined;
				$scope.timeseriesMappings_adminView = [];
		
				$scope.converter = undefined;
				$scope.schema = undefined;
				$scope.datasourceType = undefined;
				$scope.indicatorDataSourceIdProperty = undefined;
				$scope.indicatorDataSourceNameProperty = undefined;

				$scope.converterDefinition = undefined;
				$scope.datasourceTypeDefinition = undefined;
				$scope.propertyMappingDefinition = undefined;
				$scope.putBody_indicators = undefined;

				$scope.validityEndDate_perFeature = undefined;
				$scope.validityStartDate_perFeature = undefined;

				$scope.indicatorDataSourceIdProperty = undefined;
				$scope.indicatorDataSourceNameProperty = undefined;
	
				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;
				$scope.importerErrors = undefined;
	
				$("#indicatorEditFeaturesSuccessAlert").hide();
				$("#indicatorEditFeaturesErrorAlert").hide();
			};
	
			$scope.onChangeSchema = function(schema){
				$scope.schema = schema;
			};
	
			$scope.filterByKomMonitorProperties = function() {
				return function( item ) {
	
					try{
						if (item === __env.FEATURE_ID_PROPERTY_NAME || item === __env.FEATURE_NAME_PROPERTY_NAME || item === "validStartDate" || item === "validEndDate"){
							return false;
						}
						return true;
					}
					catch(error){
						return false;
					}
				};
			};

			$scope.onEditFeaturesOrUpdateTimeseriesMapping = function(){
				var tmpIndicatorTimeseriesMapping_adminView = {
					"indicatorValuesPropertyName": $scope.tmpTimeseriesMapping_indicatorValuesPropertyName,
					"timestampPropertyName": $scope.tmpTimeseriesMapping_timestampPropertyName,
					"timestampDirect": $scope.tmpTimeseriesMapping_directTimestamp
				};
	
				var processed = false;
	
				for (let index = 0; index < $scope.timeseriesMappings_adminView.length; index++) {
					var timeseriesMappingEntry_adminView = $scope.timeseriesMappings_adminView[index];
					
					if (timeseriesMappingEntry_adminView.indicatorValuesPropertyName === tmpIndicatorTimeseriesMapping_adminView.indicatorValuesPropertyName){
						// replace object
						$scope.timeseriesMappings_adminView[index] = tmpIndicatorTimeseriesMapping_adminView;
						processed = true;
						break;
					}
				}			
	
				if(! processed){
					// new entry
					$scope.timeseriesMappings_adminView.push(tmpIndicatorTimeseriesMapping_adminView);
				}
	
				$scope.tmpTimeseriesMapping_indicatorValuesPropertyName = undefined;
				$scope.tmpTimeseriesMapping_timestampPropertyName = undefined;
				$scope.tmpTimeseriesMapping_directTimestamp = undefined;
	
				setTimeout(() => {
					$scope.$apply();
				}, 250);
			};
	
			$scope.onChangeUseTimeseriesAsProperty = function(){
				if($scope.useTimeseriesAsProperty){
					$scope.tmpTimeseriesMapping_directTimestamp = undefined;
				}
				else{			
					$scope.tmpTimeseriesMapping_timestampPropertyName = undefined;
				}
			};
	
			$scope.onClickEditTimeseriesMapping = function(timeseriesMappingEntry_adminView){
	
				$scope.tmpTimeseriesMapping_indicatorValuesPropertyName = timeseriesMappingEntry_adminView.indicatorValuesPropertyName;
				$scope.tmpTimeseriesMapping_timestampPropertyName = timeseriesMappingEntry_adminView.timestampPropertyName;
				$scope.tmpTimeseriesMapping_directTimestamp = timeseriesMappingEntry_adminView.timestampDirect;			
	
				if($scope.tmpTimeseriesMapping_directTimestamp){				
					$('#indicatorEditFeaturesDirectTimestampDatepicker').datepicker('setDate', $scope.tmpTimeseriesMapping_directTimestamp);
					$scope.useTimeseriesAsProperty = false;
				}
				else{
					$scope.useTimeseriesAsProperty = true;
				}
	
				setTimeout(() => {
					$scope.$apply();
				}, 250);
			};
	
			$scope.onClickDeleteTimeseriesMapping = function(timeseriesMappingEntry_adminView){
	
				for (let index = 0; index < $scope.timeseriesMappings_adminView.length; index++) {
					
					if ($scope.timeseriesMappings_adminView[index].indicatorValuesPropertyName === timeseriesMappingEntry_adminView.indicatorValuesPropertyName){
						// remove object
						$scope.timeseriesMappings_adminView.splice(index, 1);
						break;
					}
				}				
	
				setTimeout(() => {
					$scope.$apply();
				}, 250);
			};
	
	
	
			$scope.filterIndicators = function() {
	
				return kommonitorDataExchangeService.filterIndicators();
			};
	
	
			$scope.getFeatureId = function(jsonFeature){
				return jsonFeature[__env.FEATURE_ID_PROPERTY_NAME];
			};
	
			$scope.getFeatureName = function(jsonFeature){
				return jsonFeature[__env.FEATURE_NAME_PROPERTY_NAME];
			};
	
			
			$scope.buildImporterObjects = async function(){
				$scope.converterDefinition = $scope.buildConverterDefinition();
				$scope.datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
				$scope.propertyMappingDefinition = $scope.buildPropertyMappingDefinition();
				$scope.putBody_indicators = $scope.buildPutBody_indicators();
	
				if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.putBody_indicators){
					return false;
				}
	
				return true;
			};
	
			$scope.buildConverterDefinition = function(){
	
				return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_indicatorEditFeatures_", $scope.schema);			
			};
	
			$scope.buildDatasourceTypeDefinition = async function(){
				try {
					return await kommonitorImporterHelperService.buildDatasourceTypeDefinition($scope.datasourceType, 'datasourceTypeParameter_indicatorEditFeatures_', 'indicatorDataSourceInput_editFeatures');			
				} catch (error) {
					$scope.errorMessagePart = error;
	
					$("#indicatorEditFeaturesErrorAlert").show();
					$scope.loadingData = false;
					return null;
				}			
			};
	
			$scope.buildPropertyMappingDefinition = function(){
				// arsion from is undefined currently
					// arsion from is undefined currently
				var timeseriesMappingForImporter = [];

				if($scope.timeseriesMappings_adminView && $scope.timeseriesMappings_adminView.length > 0){
					for (const timeseriesEntry_adminView of $scope.timeseriesMappings_adminView) {
						timeseriesMappingForImporter.push({
							"indicatorValueProperty": timeseriesEntry_adminView.indicatorValuesPropertyName,
							"timestamp": timeseriesEntry_adminView.timestampDirect ? timeseriesEntry_adminView.timestampDirect : undefined,
							"timestampProperty": timeseriesEntry_adminView.timestampPropertyName ? timeseriesEntry_adminView.timestampPropertyName : undefined,
						});
					}
				}
				return kommonitorImporterHelperService.buildPropertyMapping_indicatorResource($scope.spatialUnitRefKeyProperty, timeseriesMappingForImporter);	
			};
	
			$scope.buildPutBody_indicators = function(){
				var putBody =
				{
					"indicatorValues": [],
					"applicableSpatialUnit": $scope.targetSpatialUnitMetadata.spatialUnitLevel,
					"defaultClassificationMapping": $scope.currentIndicatorDataset.defaultClassificationMapping
					};
	
				return putBody;
			};
	
	
			$scope.editIndicatorFeatures = async function(){
	
				$scope.importerErrors = undefined;
					$scope.successMessagePart = undefined;
					$scope.errorMessagePart = undefined;
	
				/*
						now collect data and build request for importer
					*/
	
					/*
						if any required importer data is missing --> cancel request and highlight required errors 
					*/
					var allDataSpecified = await $scope.buildImporterObjects();
	
					if (!allDataSpecified) {
	
						$("#spatialUnitEditFeaturesForm").validator("update");
						$("#spatialUnitEditFeaturesForm").validator("validate");
						return;
					}
					else {
	
	
						// TODO verify input
	
						// TODO Create and perform POST Request with loading screen
	
						$scope.loadingData = true;
	
						var updateIndicatorResponse_dryRun = undefined;
						try {
							updateIndicatorResponse_dryRun = await kommonitorImporterHelperService.updateIndicator($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentIndicatorDataset.indicatorId, $scope.putBody_indicators, true);
	
							// this callback will be called asynchronously
							// when the response is available
	
	
	
	
							if(! kommonitorImporterHelperService.importerResponseContainsErrors(updateIndicatorResponse_dryRun)){
								// all good, really execute the request to import data against data management API
								var updateIndicatorResponse = await kommonitorImporterHelperService.updateIndicator($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentIndicatorDataset.indicatorId, $scope.putBody_indicators, false);						
	
								$rootScope.$broadcast("refreshIndicatorOverviewTable");
								// $scope.refreshIndicatorEditFeaturesOverviewTable();
	
								$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;
								$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(updateIndicatorResponse);
	
								$("#indicatorEditFeaturesSuccessAlert").show();
								$scope.loadingData = false;
							}
							else{
								// errors ocurred
								// show them 
								$scope.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
								$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun);
	
								$("#indicatorEditFeaturesErrorAlert").show();
								$scope.loadingData = false;
	
								setTimeout(() => {
									$scope.$apply();
								}, 250);
	
							}
						} catch (error) {
							if(error.data){							
								$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
							}
							else{
								$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
							}
							if(updateIndicatorResponse_dryRun){
								$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun);
							}
							
							$("#indicatorEditFeaturesErrorAlert").show();
							$scope.loadingData = false;
	
							setTimeout(() => {
								$scope.$apply();
							}, 250);
						}
					}
			};
	
				$scope.hideSuccessAlert = function(){
					$("#indicatorEditFeaturesSuccessAlert").hide();
				};
	
				$scope.hideErrorAlert = function(){
					$("#indicatorEditFeaturesErrorAlert").hide();
				};
	
				/*
				MULTI STEP FORM STUFF
				*/
				//jQuery time
				$scope.current_fs; 
				$scope.next_fs; 
				$scope.previous_fs; //fieldsets
				$scope.opacity; 
				$scope.scale; //fieldset properties which we will animate
				$scope.animating; //flag to prevent quick multi-click glitches
	
				$(".next_editFeaturesIndicator").click(function(){
					if($scope.animating) return false;
					$scope.animating = true;
					
					$scope.current_fs = $(this).parent();
					$scope.next_fs = $(this).parent().next();
					
					//activate next step on progressbar using the index of $scope.next_fs
					$("#progressbar li").eq($("fieldset").index($scope.next_fs)).addClass("active");
					
					//show the next fieldset
					$scope.next_fs.show(); 
					//hide the current fieldset with style
					$scope.current_fs.animate({opacity: 0}, {
						step: function(now, mx) {
							//as the $scope.opacity of current_fs reduces to 0 - stored in "now"
							//1. $scope.scale current_fs down to 80%
							$scope.scale = 1 - (1 - now) * 0.2;
							//2. bring $scope.next_fs from the right(50%)
							left = (now * 50)+"%";
							//3. increase $scope.opacity of $scope.next_fs to 1 as it moves in
							$scope.opacity = 1 - now;
							$scope.current_fs.css({
								'position': 'absolute'
							});
							// $scope.next_fs.css({'left': left, '$scope.opacity': $scope.opacity});
							$scope.next_fs.css({'opacity': $scope.opacity});
						}, 
						duration: 200, 
						complete: function(){
							$scope.current_fs.hide();
							$scope.animating = false;
						}, 
						//this comes from the custom easing plugin
						easing: 'easeInOutBack'
					});
				});
	
				$(".previous_editFeaturesIndicator").click(function(){
					if($scope.animating) return false;
					$scope.animating = true;
					
					$scope.current_fs = $(this).parent();
					$scope.previous_fs = $(this).parent().prev();
					
					//de-activate current step on progressbar
					$("#progressbar li").eq($("fieldset").index($scope.current_fs)).removeClass("active");
					
					//show the previous fieldset
					$scope.previous_fs.show(); 
					//hide the current fieldset with style
					$scope.current_fs.animate({opacity: 0}, {
						step: function(now, mx) {
							//as the $scope.opacity of current_fs reduces to 0 - stored in "now"
							//1. $scope.scale $scope.previous_fs from 80% to 100%
							$scope.scale = 0.8 + (1 - now) * 0.2;
							//2. take current_fs to the right(50%) - from 0%
							left = ((1-now) * 50)+"%";
							//3. increase $scope.opacity of $scope.previous_fs to 1 as it moves in
							$scope.opacity = 1 - now;
							// current_fs.css({'left': left});
							// $scope.previous_fs.css({'transform': '$scope.scale('+$scope.scale+')', '$scope.opacity': $scope.opacity});
							$scope.previous_fs.css({
								'position': 'absolute'
							});
							$scope.previous_fs.css({'opacity': $scope.opacity});
						}, 
						duration: 200, 
						complete: function(){
							$scope.current_fs.hide();
							$scope.previous_fs.css({
								'position': 'relative'
							});
							$scope.animating = false;
						}, 
						//this comes from the custom easing plugin
						easing: 'easeInOutBack'
					});
				});

	}
]});
