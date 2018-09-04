angular
		.module('wpsExecuteResultDocumentWps2')
		.component(
				'wpsExecuteResultDocumentWps2',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteResultDocument_WPS_2_0/wps-execute-result-document-wps-2-0.template.html",

					controller : [
							'wpsPropertiesService', 'wpsFormControlService', 'wpsMapService', 'wpsGeometricOutputService', '$scope', '$http',
							function WpsExecuteResultDocumentWps2Controller(
									wpsPropertiesService, wpsFormControlService, wpsMapService, wpsGeometricOutputService, $scope, $http) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								this.wpsFormControlServiceInstance = wpsFormControlService;
								this.wpsMapServiceInstance = wpsMapService;
								this.wpsGeometricOutputServiceInstance = wpsGeometricOutputService;
								
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
												
												wpsFormControlService.fetchingReferenceOutputSuccess = true;
												wpsFormControlService.fetchingReferenceOutputFailed = false;
												
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