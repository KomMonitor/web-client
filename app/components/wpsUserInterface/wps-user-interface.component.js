angular.module('wpsUserInterface').component('wpsUserInterface', {
	templateUrl : "components/wpsUserInterface/wps-user-interface.template.html",
	controller : ['wpsPropertiesService', '$scope', function UserInterfaceController(wpsPropertiesService, $scope) {

		this.wpsPropertiesServiceInstance = wpsPropertiesService;

		$scope.sidebarIndicatorConfigClass = "";

		$scope.onSidebarIndicatorButtonClick = function(){
			if($scope.sidebarIndicatorConfigClass === "active"){
				$scope.sidebarIndicatorConfigClass = "";
			}
			else{
				$scope.sidebarIndicatorConfigClass = "active";
			}

		}

	}
]});
