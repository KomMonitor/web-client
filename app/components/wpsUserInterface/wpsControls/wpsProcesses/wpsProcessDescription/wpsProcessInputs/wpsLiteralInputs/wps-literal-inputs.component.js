angular
		.module('wpsLiteralInputs')
		.component(
				'wpsLiteralInputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsLiteralInputs/wps-literal-inputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsLiteralInputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;


							} ]
				});