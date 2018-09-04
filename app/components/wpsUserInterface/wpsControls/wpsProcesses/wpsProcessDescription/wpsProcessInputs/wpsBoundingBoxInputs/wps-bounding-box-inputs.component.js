angular
		.module('wpsBoundingBoxInputs')
		.component(
				'wpsBoundingBoxInputs',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsBoundingBoxInputs/wps-bounding-box-inputs.template.html",

					controller : [
							'wpsPropertiesService', 'wpsInputOutputFilterService',
							function WpsBoundingBoxInputsController(
									wpsPropertiesService, wpsInputOutputFilterService) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsInputOutputFilterServiceInstance = wpsInputOutputFilterService;


							} ]
				});