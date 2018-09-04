angular
		.module('wpsExecuteStatusInfoDocumentWps2')
		.component(
				'wpsExecuteStatusInfoDocumentWps2',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteStatusInfoDocument_WPS_2_0/wps-execute-status-info-document-wps-2-0.template.html",

					controller : [
							'wpsPropertiesService', '$scope',
							function WpsExecuteStatusInfoDocumentWps2Controller(
									wpsPropertiesService, $scope) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

								this.refreshStatus = function() {
									/*
									 * TODO get job-id from current statusInfo
									 * document and trigger getStatusRequest!
									 */
									var jobId = this.wpsPropertiesServiceInstance.statusInfoDocument_wps_2_0.jobId;

									this.wpsPropertiesServiceInstance
											.getStatus(
													this.onRefreshedStatusInfoDocument,
													jobId);
								};

								this.onRefreshedStatusInfoDocument = function(
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
								
								this.getResult = function(){
									/*
									 * TODO get job-id from current statusInfo
									 * document and trigger getResultRequest!
									 */
									var jobId = this.wpsPropertiesServiceInstance.statusInfoDocument_wps_2_0.jobId;

									this.wpsPropertiesServiceInstance
											.getResult(
													this.getResultCallback,
													jobId);
								};
								
								this.getResultCallback = function(
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

							} ]
				});