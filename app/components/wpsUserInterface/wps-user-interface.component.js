angular.module('wpsUserInterface').component('wpsUserInterface', {
	templateUrl : "components/wpsUserInterface/wps-user-interface.template.html",
	controller : ['wpsPropertiesService', function UserInterfaceController(wpsPropertiesService) {
		
		this.wpsPropertiesServiceInstance = wpsPropertiesService;
		
	}
]});