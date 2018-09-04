angular
		.module('wpsCapabilitiesServiceIdentification')
		.component(
				'wpsCapabilitiesServiceIdentification',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceIdentification/wps-capabilities-service-identification.template.html",

					controller : [
							'wpsPropertiesService',
							function WpsCapabilitiesServiceIdentificationController(
									wpsPropertiesService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

							} ]
				});