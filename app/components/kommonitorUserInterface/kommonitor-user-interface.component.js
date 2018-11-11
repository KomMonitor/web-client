angular.module('kommonitorUserInterface').component('kommonitorUserInterface', {
	templateUrl : "components/kommonitorUserInterface/kommonitor-user-interface.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function UserInterfaceController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.anySideBarIsShown = false;

		$scope.sidebarIndicatorConfigClass = "hidden";
		$scope.sidebarMeasureOfValueClassificationClass = "hidden";
		$scope.sidebarDiagramsClass = "hidden";
		$scope.sidebarRadarDiagramClass = "hidden";
		$scope.sidebarProcessingClass = "hidden";

		$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
		$scope.buttonMeasureOfValueClassificationClass = "btn btn-custom btn-circle";
		$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
		$scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
		$scope.buttonProcessingClass = "btn btn-custom btn-circle";

		$scope.undockButtons = function(){
			$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
			$scope.buttonMeasureOfValueClassificationClass = "btn btn-custom btn-circle";
			$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
			$scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
			$scope.buttonProcessingClass = "btn btn-custom btn-circle";
		};

		$scope.hideSidebars = function(){
			$scope.sidebarIndicatorConfigClass = "hidden";
			$scope.sidebarMeasureOfValueClassificationClass = "hidden";
			$scope.sidebarDiagramsClass = "hidden";
			$scope.sidebarRadarDiagramClass = "hidden";
			$scope.sidebarProcessingClass = "hidden";
		};

		$scope.onSidebarIndicatorButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarIndicatorConfigClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarIndicatorConfigClass = "";
				$scope.buttonIndicatorConfigClass = "btn btn-custom btn-docked";

				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarIndicatorConfigClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");

		}

		$scope.onSidebarMeasureOfValueClassificationButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarMeasureOfValueClassificationClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarMeasureOfValueClassificationClass = "";
				$scope.buttonMeasureOfValueClassificationClass = "btn btn-custom btn-docked";
				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarMeasureOfValueClassificationClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
		}

		$scope.onSidebarDiagramsClick = function(){
			$scope.undockButtons();
			if($scope.sidebarDiagramsClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarDiagramsClass = "";
				$scope.buttonDiagramsClass = "btn btn-custom btn-docked";
				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarDiagramsClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
		}

		$scope.onSidebarRadarDiagramClick = function(){
			$scope.undockButtons();
			if($scope.sidebarRadarDiagramClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarRadarDiagramClass = "";
				$scope.buttonRadarDiagramClass = "btn btn-custom btn-docked";
				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarRadarDiagramClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
		}

		$scope.onSidebarProcessingClick = function(){
			$scope.undockButtons();
			if($scope.sidebarProcessingClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarProcessingClass = "";
				$scope.buttonProcessingClass = "btn btn-custom btn-docked";
				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarProcessingClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
		}

		$scope.onRecenterMapButtonClick = function(){
			$rootScope.$broadcast("recenterMapContent");
		}

		$scope.onUnselectFeaturesButtonClick = function(){
			$rootScope.$broadcast("unselectAllFeatures");
		}

	}
]});
