angular.module('wpsFormControl', [ 'wpsProperties', 'wpsExecuteInput', 'wpsExecuteOutput']);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 * 
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 * 
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular.module('wpsFormControl').service('wpsFormControlService', 
		[ '$rootScope', 'wpsPropertiesService', 'wpsExecuteInputService', 'wpsExecuteOutputService', 
		  function($rootScope, wpsPropertiesService, wpsExecuteInputService, wpsExecuteOutputService) {

			this.wpsPropertiesServiceInstance = wpsPropertiesService;
			this.wpsExecuteInputServiceInstance = wpsExecuteInputService;
			this.wpsExecuteOutputServiceInstance = wpsExecuteOutputService;
			
			/**
			 * initialize as disabled and not clickable
			 */
			this.capabilitiesTab_classAttribute = 'disabled';
			this.capabilitiesTab_dataToggleAttribute = '';

			this.processesTab_classAttribute = 'disabled';
			this.processesTab_dataToggleAttribute = '';

			this.executeTab_classAttribute = 'disabled';
			this.executeTab_dataToggleAttribute = '';
			
			/*
			 * removeWPS button
			 */
			this.removeWpsServiceButton_classAttribute = 'disabled';
			
			/*
			 * remove already defined input/output for execute button
			 */
			this.isRemoveInputButtonDisabled = true;
			this.isRemoveOutputButtonDisabled = true;
			
			/*
			 * WPS capabilities error
			 */
			this.capabilitiesFailed_classAttribute = 'hidden';
			this.capabilitiesSuccess_classAttribute = 'hidden';
			
			this.capabilitiesFailed_errorThrown = '';
			
			/*
			 * describeProcess error
			 */
			this.describeProcessFailed_classAttribute = 'hidden';
			this.describeProcessSuccess_classAttribute = 'hidden';
			
			this.describeProcessFailed_errorThrown = '';
			
			/*
			 * execute error
			 */
			this.executeFailed_classAttribute = 'hidden';
			this.executeSuccess_classAttribute = 'hidden';
			
			this.executeFailed_errorThrown = '';
			
			/*
			 * indicates whether a request to fetch a reference output failed
			 */
			this.fetchingReferenceOutputFailed = false;
			this.fetchingReferenceOutputSuccess = false;
			
			/*
			 * tab management
			 */
			this.enableTabs = function(){
				/*
				 * enable tabs
				 */
				this.capabilitiesTab_classAttribute = 'enabled';
				this.capabilitiesTab_dataToggleAttribute = 'tab';

				this.processesTab_classAttribute = 'enabled';
				this.processesTab_dataToggleAttribute = 'tab';

				
				this.removeWpsServiceButton_classAttribute = 'enabled';
			};
			
			this.disableTabs = function(){
				/*
				 * disable all
				 */
				this.capabilitiesTab_classAttribute = 'disabled';
				this.capabilitiesTab_dataToggleAttribute = '';

				this.processesTab_classAttribute = 'disabled';
				this.processesTab_dataToggleAttribute = '';

				this.executeTab_classAttribute = 'disabled';
				this.executeTab_dataToggleAttribute = '';

			};
			
			this.resetTabContents = function(){
				
				this.wpsExecuteInputServiceInstance.reset();
				this.wpsExecuteOutputServiceInstance.reset();
				
				this.wpsPropertiesServiceInstance.resetExecuteContents();
				
				this.resetErrorMessages();
				this.resetExecute();
			};
			
			this.resetErrorMessages = function(){
				/*
				 * WPS capabilities error
				 */
				this.capabilitiesFailed_classAttribute = 'hidden';
				this.capabilitiesSuccess_classAttribute = 'hidden';
				
				this.capabilitiesFailed_errorThrown = '';
				
				/*
				 * describeProcess error
				 */
				this.describeProcessFailed_classAttribute = 'hidden';
				this.describeProcessSuccess_classAttribute = 'hidden';
				
				this.describeProcessFailed_errorThrown = '';
				
				/*
				 * execute error
				 */
				this.executeFailed_classAttribute = 'hidden';
				this.executeSuccess_classAttribute = 'hidden';
				
				this.executeFailed_errorThrown = '';
			};
			
			this.resetExecute = function(){
				/*
				 * reset execute form
				 */
				this.wpsPropertiesServiceInstance.resetResponseDocuments();
				this.resetErrorMessages();
				this.wpsPropertiesServiceInstance.resetExecuteContents();
				
				// reset all input forms!
				$rootScope.$broadcast('reset-all-input-forms', {});
				
//				// remove all overlays from map!
//				$rootScope.$broadcast('reset-map-overlays', {});
				
				this.fetchingReferenceOutputFailed = false;
				this.fetchingReferenceOutputSuccess = false;
			};

		} ]);