angular
		.module('wpsCapabilitiesServiceOperations')
		.component(
				'wpsCapabilitiesServiceOperations',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceOperations/wps-capabilities-service-operations.template.html",

					controller : [
							'wpsPropertiesService',
							function WpsCapabilitiesServiceOperationsController(
									wpsPropertiesService) {
								/*
								 * references to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

							} ]
				});