angular.module('wpsUserInterface').component('wpsUserInterface', {
	templateUrl : "components/wpsUserInterface/wps-user-interface.template.html",
	controller : ['wpsPropertiesService', '$scope', function UserInterfaceController(wpsPropertiesService, $scope) {

		this.wpsPropertiesServiceInstance = wpsPropertiesService;

		$scope.sidebarIndicatorConfigClass = "";
		$scope.sidebarDiagramsClass = "hidden";

		$scope.hideSidebars = function(){
			$scope.sidebarIndicatorConfigClass = "hidden";
			$scope.sidebarDiagramsClass = "hidden";
		};

		$scope.onSidebarIndicatorButtonClick = function(){

			if($scope.sidebarIndicatorConfigClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarIndicatorConfigClass = "";
			}
			else{
				$scope.sidebarIndicatorConfigClass = "hidden";
			}
		}

		$scope.onSidebarDiagramsClick = function(){
			if($scope.sidebarDiagramsClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarDiagramsClass = "";
			}
			else{
				$scope.sidebarDiagramsClass = "hidden";
			}
		}

	}
]});
