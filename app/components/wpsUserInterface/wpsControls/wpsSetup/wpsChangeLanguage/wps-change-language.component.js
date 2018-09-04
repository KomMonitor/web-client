angular
		.module('wpsChangeLanguage')
		.component(
				'wpsChangeLanguage',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsSetup/wpsChangeLanguage/wps-change-language.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$translate', function WpsChangeLanguageController($translate) {
						this.availableLanguages = [ {
							name : 'Deutsch',
							key : 'de'
						}, {
							name : 'English',
							key : 'en'
						} ];
						
						/*
						 * holds the selected language object
						 */
						this.selectedLanguage = '';
						
						this.changeWpsLanguage = function(){
							$translate.use(this.selectedLanguage.key);
						};
					}]
				});