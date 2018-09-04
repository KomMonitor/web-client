angular
		.module('wpsExecuteResponseDocumentWps1')
		.component(
				'wpsExecuteResponseDocumentWps1',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteResponseDocument_WPS_1_0/wps-execute-response-document-wps-1-0.template.html",

					controller : [
							'wpsPropertiesService', 'wpsFormControlService', 'wpsMapService', 'wpsGeometricOutputService', '$scope', '$http',
							function WpsExecuteResponseDocumentWps1Controller(
									wpsPropertiesService, wpsFormControlService, wpsMapService, wpsGeometricOutputService, $scope, $http) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								this.wpsFormControlServiceInstance = wpsFormControlService;
								this.wpsMapServiceInstance = wpsMapService;
								this.wpsGeometricOutputServiceInstance = wpsGeometricOutputService;
								
								this.refreshStatus = function() {
									/*
									 * TODO get statusLocation value from current response 
									 * document and trigger !
									 */
									var documentLocation = this.wpsPropertiesServiceInstance.responseDocument_wps_1_0.statusLocation;

									this.wpsPropertiesServiceInstance
											.fetchUpdatedResponseDocument_wps_1_0(
													this.onRefreshedResponseDocument, documentLocation);
								};

								this.onRefreshedResponseDocument = function(
										wpsResponse) {
									/*
									 * check response for reasonable content
									 */
									if (wpsResponse.executeResponse)
										wpsPropertiesService
												.onExecuteResponseChange(wpsResponse.executeResponse);

									/**
									 * TODO error/success messages?
									 */
									
									$scope.$apply();
								};
								
								this.isGeometricFormat = function(output){
									// delegate to wpsGeometricOutputService 
									return this.wpsGeometricOutputServiceInstance.isGeometricFormat(output);
								};
								
								this.fetchAndVisualizeReferenceOutput = function(referenceOutput){
									
									var url = referenceOutput.reference.href;
									
									if (this.wpsGeometricOutputServiceInstance.isGeoJSON(referenceOutput)){
										$http({
											  method: 'GET',
											  url: url
											}).then(function successCallback(response) {
											    // this callback will be called asynchronously
											    // when the response is available
												
												wpsFormControlService.fetchingReferenceOutputFailed = false;
												wpsFormControlService.fetchingReferenceOutputSuccess = true;
												
												/*
												 * make output a complexOutput
												 * and store the retrieved GeoJSON value 
												 */
												
												if(response.data){
													referenceOutput.data = {};
													referenceOutput.data.complexData = {};
													referenceOutput.data.complexData.value = response.data;
													
													
													wpsMapService.addComplexOutputToMap(referenceOutput, wpsMapService.generateUniqueOutputLayerPropertyName());	
												}

											  }, function errorCallback(response) {
											    // called asynchronously if an error occurs
											    // or server returns response with an error status.
												  wpsFormControlService.fetchingReferenceOutputSuccess = false;
												  wpsFormControlService.fetchingReferenceOutputFailed = true;
											  });
									}
									else{
										/*
										 * TODO transform to GeoJSON 
										 * 
										 */
									}

								};

							} ]
				});