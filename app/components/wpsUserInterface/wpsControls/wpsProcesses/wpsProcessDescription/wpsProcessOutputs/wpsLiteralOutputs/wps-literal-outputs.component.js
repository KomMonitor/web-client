angular
		.module('wpsLiteralOutputs')
		.component(
				'wpsLiteralOutputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsLiteralOutputs/wps-literal-outputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsLiteralOutputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;


							} ]
				});