angular
		.module('wpsExecuteSetupRequest')
		.component(
				'wpsExecuteSetupRequest',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wps-execute-setup-request.template.html",

					controller : [
							'wpsPropertiesService', 'wpsFormControlService', '$scope',
							function WpsExecuteSetupRequestController(
									wpsPropertiesService, wpsFormControlService, $scope) {
								/*
								 * references to wpsPropertiesService and wpsFormControl instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsFormControlServiceInstance = wpsFormControlService;
								
								this.executeFailed_classAttribute = 'hidden';
								this.executeSuccess_classAttribute = 'hidden';
								
								this.executeFailed_errorThrown = '';
								
								$scope.loadingData = false;
								
								this.performExecuteRequest = function() {
									
									this.executeFailed_classAttribute = 'hidden';
									this.executeSuccess_classAttribute = 'hidden';
									
									this.executeFailed_errorThrown = '';
									
									$scope.loadingData = true;
									
									this.wpsPropertiesServiceInstance.execute(this.executeCallback);
									
									this.wpsFormControlServiceInstance.resetTabContents();
								};
								
								this.executeCallback = function(executeResponseObj){
									
									$scope.loadingData = false;
									
									/*
									 * check received capObject for reasonable structure.
									 * 
									 * if successful, it will have a property named 'executeResponse'
									 */
									if(executeResponseObj.executeResponse){
										/*
										 * re-call wpsPropertiesService to actually modify it's capabilities object
										 */
										var executeResponse = executeResponseObj.executeResponse;
										wpsPropertiesService.onExecuteResponseChange(executeResponse);
										
										wpsFormControlService.executeSuccess_classAttribute = '';
										
										/*
										 * TODO enable GetStatus and GetResult Tabs
										 */
										
									}
									else{

										/*
										 * TODO block GetStatus and GetResult tabs
										 */
										
										/*
										 * error occurred!
										 * enable error message
										 */
										wpsFormControlService.executeFailed_errorThrown = executeResponseObj.errorThrown;
										wpsFormControlService.executeFailed_classAttribute = '';
									}
									
									/*
									 * call $apply manually to modify service references
									 */
									$scope.$apply();
								}
							} ]
				});