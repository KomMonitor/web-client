angular
		.module('wpsCapabilitiesServiceProvider')
		.component(
				'wpsCapabilitiesServiceProvider',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceProvider/wps-capabilities-service-provider.template.html",

					controller : [
							'wpsPropertiesService',
							function WpsCapabilitiesServiceProviderController(
									wpsPropertiesService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

							} ]
				});