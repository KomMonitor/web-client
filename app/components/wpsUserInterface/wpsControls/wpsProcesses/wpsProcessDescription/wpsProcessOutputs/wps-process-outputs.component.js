angular
		.module('wpsProcessOutputs')
		.component(
				'wpsProcessOutputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wps-process-outputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsProcessOutputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;

							} ]
				});