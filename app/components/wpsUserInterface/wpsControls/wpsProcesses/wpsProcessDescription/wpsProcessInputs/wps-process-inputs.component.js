angular
		.module('wpsProcessInputs')
		.component(
				'wpsProcessInputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wps-process-inputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsProcessInputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;

							} ]
				});