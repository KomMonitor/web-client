angular
		.module('wpsGeneralProcessInformation')
		.component(
				'wpsGeneralProcessInformation',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsGeneralProcessInformation/wps-general-process-information.template.html",

					controller : [
							'wpsPropertiesService',
							function WpsGeneralProcessInformationController(
									wpsPropertiesService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

							} ]
				});