angular.module('kommonitorUserInterface').component('kommonitorUserInterface', {
	templateUrl : "components/kommonitorUserInterface/kommonitor-user-interface.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function UserInterfaceController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.anySideBarIsShown = false;

		$scope.sidebarIndicatorConfigClass = "hidden";
		$scope.sidebarDiagramsClass = "hidden";
		$scope.sidebarRadarDiagramClass = "hidden";
		$scope.sidebarProcessingClass = "hidden";
		$scope.sidebarRegressionDiagramClass = "hidden";
		$scope.sidebarFilterClass = "hidden";
		$scope.sidebarBalanceClass = "hidden";
		$scope.sidebarReachabilityClass = "hidden";
		$scope.sidebarPoiClass = "hidden";

		$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
		$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
		$scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
		$scope.buttonProcessingClass = "btn btn-custom btn-circle";
		$scope.buttonRegressionDiagramClass = "btn btn-custom btn-circle";
		$scope.buttonFilterClass = "btn btn-custom btn-circle";
		$scope.buttonBalanceClass = "btn btn-custom btn-circle";
		$scope.buttonReachabilityClass = "btn btn-custom btn-circle";
		$scope.buttonPoiClass = "btn btn-custom btn-circle";

		$scope.undockButtons = function(){
			$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
			$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
			$scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
			$scope.buttonProcessingClass = "btn btn-custom btn-circle";
			$scope.buttonRegressionDiagramClass = "btn btn-custom btn-circle";
			$scope.buttonFilterClass = "btn btn-custom btn-circle";
			$scope.buttonBalanceClass = "btn btn-custom btn-circle";
			$scope.buttonReachabilityClass = "btn btn-custom btn-circle";
			$scope.buttonPoiClass = "btn btn-custom btn-circle";

			// in addition check if balance menue and button are allowed for current indicator
			// it is not allowed if indicator is of type "DYNAMIC"
			$scope.checkBalanceButtonAndMenueState();
		};

		$scope.hideSidebars = function(){
			$scope.sidebarIndicatorConfigClass = "hidden";
			$scope.sidebarDiagramsClass = "hidden";
			$scope.sidebarRadarDiagramClass = "hidden";
			$scope.sidebarProcessingClass = "hidden";
			$scope.sidebarRegressionDiagramClass = "hidden";
			$scope.sidebarFilterClass = "hidden";
			$scope.sidebarBalanceClass = "hidden";
			$scope.sidebarReachabilityClass = "hidden";
			$scope.sidebarPoiClass = "hidden";
		};

		$scope.checkBalanceButtonAndMenueState = function(){
			if(kommonitorDataExchangeService.selectedIndicator.indicatorType === "DYNAMIC"){
				$scope.buttonBalanceClass = "btn btn-custom btn-circle disabled";
				$scope.sidebarBalanceClass = "hidden";
			}
			else{
				$scope.buttonBalanceClass = "btn btn-custom btn-circle";
			}
		};

		$scope.$on("checkBalanceMenueAndButton", function(event){
			$scope.checkBalanceButtonAndMenueState();
		});

		$scope.onSidebarIndicatorButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarIndicatorConfigClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarIndicatorConfigClass = "";
				$scope.buttonIndicatorConfigClass = "btn btn-custom-docked btn-docked";

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
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");

		}

		$scope.onSidebarPoiButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarPoiClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarPoiClass = "";
				$scope.buttonPoiClass = "btn btn-custom-docked btn-docked";

				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarPoiClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");

		}

		$scope.onSidebarFilterButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarFilterClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarFilterClass = "";
				$scope.buttonFilterClass = "btn btn-custom-docked btn-docked";

				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarFilterClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");

		}

		$scope.onSidebarBalanceButtonClick = function(){

			// check if button is marked as disabled
			if($scope.buttonBalanceClass.includes("disabled")){
				// do nothing
				return;
			}
			else{
				$scope.undockButtons();

				if($scope.sidebarBalanceClass === "hidden"){
					$scope.hideSidebars();
					$scope.sidebarBalanceClass = "";
					$scope.buttonBalanceClass = "btn btn-custom-docked btn-docked";

					if($scope.anySideBarIsShown === false){
						$rootScope.$broadcast("recenterMapOnShowSideBar");
					}
					$scope.anySideBarIsShown = true;
				}
				else{
					$scope.sidebarBalanceClass = "hidden";
					$rootScope.$broadcast("recenterMapOnHideSideBar");
					$scope.anySideBarIsShown = false;
				}
				$rootScope.$broadcast("refreshDateSlider");
				$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			}
		}

		$scope.onSidebarReachabilityButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarReachabilityClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarReachabilityClass = "";
				$scope.buttonReachabilityClass = "btn btn-custom-docked btn-docked";

				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarReachabilityClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");

		}

		$scope.onSidebarDiagramsClick = function(){
			$scope.undockButtons();
			if($scope.sidebarDiagramsClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarDiagramsClass = "";
				$scope.buttonDiagramsClass = "btn btn-custom-docked btn-docked";
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
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
		}

		$scope.onSidebarRadarDiagramClick = function(){
			$scope.undockButtons();
			if($scope.sidebarRadarDiagramClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarRadarDiagramClass = "";
				$scope.buttonRadarDiagramClass = "btn btn-custom-docked btn-docked";
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
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
		}

		$scope.onSidebarProcessingClick = function(){
			$scope.undockButtons();
			if($scope.sidebarProcessingClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarProcessingClass = "";
				$scope.buttonProcessingClass = "btn btn-custom-docked btn-docked";
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
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
		}

		$scope.onSidebarRegressionDiagramClick = function(){
			$scope.undockButtons();
			if($scope.sidebarRegressionDiagramClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarRegressionDiagramClass = "";
				$scope.buttonRegressionDiagramClass = "btn btn-custom-docked btn-docked";
				if($scope.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				$scope.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarRegressionDiagramClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				$scope.anySideBarIsShown = false;
			}
			$rootScope.$broadcast("refreshDateSlider");
			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
		}

		$scope.onRecenterMapButtonClick = function(){
			$rootScope.$broadcast("recenterMapContent");
		}

		$scope.onUnselectFeaturesButtonClick = function(){
			$rootScope.$broadcast("unselectAllFeatures");
		}

		$scope.onToggleInfoControlButtonClick = function(){
			$rootScope.$broadcast("toggleInfoControl");
		}

		$scope.onToggleLegendControlButtonClick = function(){
			$rootScope.$broadcast("toggleLegendControl");
		}

	}
]});
