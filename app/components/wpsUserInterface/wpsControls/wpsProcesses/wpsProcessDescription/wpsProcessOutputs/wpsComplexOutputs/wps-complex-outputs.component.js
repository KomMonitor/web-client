angular
		.module('wpsComplexOutputs')
		.component(
				'wpsComplexOutputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsComplexOutputs/wps-complex-outputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsComplexOutputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;


							} ]
				});