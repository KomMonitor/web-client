angular
		.module('wpsComplexInputs')
		.component(
				'wpsComplexInputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsComplexInputs/wps-complex-inputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsComplexInputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;


							} ]
				});