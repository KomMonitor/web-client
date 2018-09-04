angular
		.module('wpsBoundingBoxOutputs')
		.component(
				'wpsBoundingBoxOutputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsBoundingBoxOutputs/wps-bounding-box-outputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsBoundingBoxOutputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;


							} ]
				});