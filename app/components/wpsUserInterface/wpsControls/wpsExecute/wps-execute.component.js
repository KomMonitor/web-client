angular
		.module('wpsExecute')
		.component(
				'wpsExecute',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wps-execute.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : [
							'wpsPropertiesService',
							'wpsFormControlService',
							function WpsExecuteController(wpsPropertiesService,
									wpsFormControlService) {
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								this.wpsFormControlServiceInstance = wpsFormControlService;
							} ]
				});