angular.module('wpsUserInterface').component('wpsUserInterface', {
	templateUrl : "components/wpsUserInterface/wps-user-interface.template.html",
	controller : ['wpsPropertiesService', '$scope', function UserInterfaceController(wpsPropertiesService, $scope) {

		this.wpsPropertiesServiceInstance = wpsPropertiesService;

		$scope.sidebarIndicatorConfigClass = "";
		$scope.sidebarDiagramsClass = "hidden";

		$scope.buttonIndicatorConfigClass = "btn btn-custom btn-docked";
		$scope.buttonDiagramsClass = "btn btn-custom btn-circle";

		$scope.undockButtons = function(){
			$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
			$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
		};

		$scope.hideSidebars = function(){
			$scope.sidebarIndicatorConfigClass = "hidden";
			$scope.sidebarDiagramsClass = "hidden";
		};

		$scope.onSidebarIndicatorButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarIndicatorConfigClass === "hidden"){
				$scope.hideSidebars();
				$scope.undockButtons();
				$scope.sidebarIndicatorConfigClass = "";
				$scope.buttonIndicatorConfigClass = "btn btn-custom btn-docked";
			}
			else{
				$scope.sidebarIndicatorConfigClass = "hidden";
			}
		}

		$scope.onSidebarDiagramsClick = function(){
			$scope.undockButtons();
			if($scope.sidebarDiagramsClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarDiagramsClass = "";
				$scope.buttonDiagramsClass = "btn btn-custom btn-docked";
			}
			else{
				$scope.sidebarDiagramsClass = "hidden";
			}
		}

	}
]});
