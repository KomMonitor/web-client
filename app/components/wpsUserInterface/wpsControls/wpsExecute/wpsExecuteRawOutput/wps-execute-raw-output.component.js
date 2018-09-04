angular
		.module('wpsExecuteRawOutput')
		.component(
				'wpsExecuteRawOutput',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteRawOutput/wps-execute-raw-output.template.html",

					controller : [
							'wpsPropertiesService', 'wpsFormControlService',
							function WpsExecuteRawOutputController(
									wpsPropertiesService, wpsFormControlService) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								
								this.wpsFormControlServiceInstance = wpsFormControlService;

							} ]
				});