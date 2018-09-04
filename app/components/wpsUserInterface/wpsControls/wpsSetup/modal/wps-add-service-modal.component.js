angular
		.module('wpsAddServiceModal')
		.component(
				'wpsAddServiceModal',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsSetup/modal/wps-add-service-modal.template.html",

					controller : [
							'wpsPropertiesService',
							function WpsAddServiceModalController(
									wpsPropertiesService) {

								/*
								 * references to wpsPropertiesService and
								 * wpsFormControl instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

								this.temporaryWpsURL;

								this.addNewWpsServiceButton_classAttribute = 'disabled';
								this.isDisabled = true;
								this.alertMessage_classAttribute = 'hidden';
								this.successMessage_classAttribute = 'hidden';
								this.inputFormColor_classAttribute = '';

								this.tryAddNewWpsServiceUrl = function() {
									/*
									 * check for http: or https: check for
									 * whitespaces check if already in list
									 */
									if (!(this.temporaryWpsURL.indexOf(' ') > -1)
											&& !(this.wpsPropertiesServiceInstance.availableWpsServices
													.indexOf('Sam') > -1)) {

										this.wpsPropertiesServiceInstance
												.addNewWpsServiceUrl(this.temporaryWpsURL);
										this.successMessage_classAttribute = '';

										this.inputFormColor_classAttribute = 'has-success';
										this.addNewWpsServiceButton_classAttribute = 'disabled';
										this.isDisabled = true;

									} else {

										this.inputFormColor_classAttribute = 'has-error';

										this.addNewWpsServiceButton_classAttribute = 'disabled';
										this.isDisabled = true;
										/*
										 * show alert message
										 */
										this.alertMessage_classAttribute = '';
									}
								};

								this.onChangeText = function() {
									this.alertMessage_classAttribute = 'hidden';
									this.successMessage_classAttribute = 'hidden';
									this.inputFormColor_classAttribute = '';

									if ((this.temporaryWpsURL
											.startsWith('http:') || this.temporaryWpsURL
											.startsWith('https:'))) {
										this.isDisabled = false;
										this.addNewWpsServiceButton_classAttribute = 'enabled';

									} else {
										this.isDisabled = true;
										this.addNewWpsServiceButton_classAttribute = 'disabled';

									}
								};
							} ]
				});