angular
		.module('wpsProcessDescription')
		.component(
				'wpsProcessDescription',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wps-process-description.template.html",
					controller : ['wpsPropertiesService', function WpsProcessDescriptionController(
							wpsPropertiesService, wpsFormControlService, $scope) {

						this.wpsPropertiesServiceInstance = wpsPropertiesService;
						
						
						this.changeWpsProcess = function(){
							/*									
							 * reset capabilities divs
							 */
							wpsFormControlService.describeProcessSuccess_classAttribute = 'hidden';
							wpsFormControlService.describeProcessFailed_classAttribute = 'hidden';
							
							wpsPropertiesService.describeProcess(this.describeProcessCallback);
						}
						
						this.describeProcessCallback = function(describeProcessResponse){
							/*
							 * TODO block execute once a process description could not be retrieved?
							 */
							
							
							/*
							 * check received object for reasonable structure.
							 */
							if(describeProcessResponse.processOffering){
								/*
								 * re-call wpsPropertiesService to actually modify it's processDescription object
								 */
								var processDescrObject = describeProcessResponse.processOffering;
								wpsPropertiesService.onProcessDescriptionChange(processDescrObject);
								
								wpsFormControlService.describeProcessSuccess_classAttribute = '';
								
								
								//wpsFormControlService.enableTabs();
								
								
							}
							else{

								// wpsFormControlService.disableTabs();
								/*
								 * error occurred!
								 * enable error message
								 */
								wpsFormControlService.describeProcessFailed_errorThrown = describeProcessResponse.errorThrown;
								wpsFormControlService.describeProcessFailed_classAttribute = '';
							}
							
							/*
							 * call $apply manually to modify service references
							 */
							$scope.$apply();
						}
						
					}]
				});