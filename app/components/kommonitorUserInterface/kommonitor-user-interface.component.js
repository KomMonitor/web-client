angular.module('kommonitorUserInterface').component('kommonitorUserInterface', {
	templateUrl : "components/kommonitorUserInterface/kommonitor-user-interface.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function UserInterfaceController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		kommonitorDataExchangeService.anySideBarIsShown = false;

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

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarIndicatorConfigClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");

		}

		$scope.onSidebarPoiButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarPoiClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarPoiClass = "";
				$scope.buttonPoiClass = "btn btn-custom-docked btn-docked";

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarPoiClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");

		}

		$scope.onSidebarFilterButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarFilterClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarFilterClass = "";
				$scope.buttonFilterClass = "btn btn-custom-docked btn-docked";

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarFilterClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

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

					if(kommonitorDataExchangeService.anySideBarIsShown === false){
						$rootScope.$broadcast("recenterMapOnShowSideBar");
					}
					kommonitorDataExchangeService.anySideBarIsShown = true;
				}
				else{
					$scope.sidebarBalanceClass = "hidden";
					$rootScope.$broadcast("recenterMapOnHideSideBar");
					kommonitorDataExchangeService.anySideBarIsShown = false;
				}

				$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			}
		}

		$scope.onSidebarReachabilityButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarReachabilityClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarReachabilityClass = "";
				$scope.buttonReachabilityClass = "btn btn-custom-docked btn-docked";

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarReachabilityClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");

		}

		$scope.onSidebarDiagramsClick = function(){
			$scope.undockButtons();
			if($scope.sidebarDiagramsClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarDiagramsClass = "";
				$scope.buttonDiagramsClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarDiagramsClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
		}

		$scope.onSidebarRadarDiagramClick = function(){
			$scope.undockButtons();
			if($scope.sidebarRadarDiagramClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarRadarDiagramClass = "";
				$scope.buttonRadarDiagramClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarRadarDiagramClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
		}

		$scope.onSidebarProcessingClick = function(){
			$scope.undockButtons();
			if($scope.sidebarProcessingClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarProcessingClass = "";
				$scope.buttonProcessingClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarProcessingClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
		}

		$scope.onSidebarRegressionDiagramClick = function(){
			$scope.undockButtons();
			if($scope.sidebarRegressionDiagramClass === "hidden"){
				$scope.hideSidebars();
				$scope.sidebarRegressionDiagramClass = "";
				$scope.buttonRegressionDiagramClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarRegressionDiagramClass = "hidden";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

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

		$scope.startGuidedTour = function(){
			// GUIDED TOUR
			// Instance the tour
			kommonitorDataExchangeService.guidedTour = new Tour({
				container: "body",
				backdrop: true,
				backdropContainer: "body",
				smartPlacement: false,
				// template: "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'>    <button class='btn btn-default' data-role='prev'>« Prev</button>    <span data-role='separator'>|</span>    <button class='btn btn-default' data-role='next'>Next »</button></div>	</div><button class='btn btn-default' data-role='end'>End tour</button></div>",
				steps: [
			  {
			    element: "#header",
			    title: "Header",
					placement: "bottom",
			    content: "In der Kopfzeile befinden sich neben dem Titel der Webanwendung ein Info-Button, der das beim Aufurf der Seite erschienene Informationsfenster öffnet, sowie Button zum (erneuten) Starten der geführten Tour. Ganz rechts sehen Sie darüber hinaus die Logos der Partner des Projekts KomMonitor, inklusive Links zu deren Webseiten."
			  },
				{
			    element: "#map",
			    title: "Kartenfenster",
					placement: "top",
			    content: "Beim Anwendungsstart sehen Sie zunächst die kartographische Darstellung eines zufällig ausgewählten Indikators. In dieser Darstellung können Sie in der Karte frei navigieren (zoomen, verschieben) und beim Herüberfahren mit dem Mauszeiger über eines der Indikator-Geometrien erhalten sie ein Popup mit dem Indikator-Wert."
			  },
				{
			    element: "#infoControl",
			    title: "Indikatoren-Informationsfenster",
					placement: "left",
			    content: "Dieses Element enthält relevante Metadaten über den dargestellten Indikator. Darüber hinaus kann die Raumebene gewechselt werden (in Abhängigkeit der verfügbaren Raumebenen des selektierten Indikators). Die Checkbox unten steuert, ob der Indikator-Layer semi-transparent dargestellt werden soll."
			  },
				{
			    element: "#legendControl",
			    title: "Indikatoren-Legende",
					placement: "left",
			    content: "Dieses Element repräsentiert die Legende, sprich die Zuordnung von Indikatorenwertebereichen zu Darstellungsfarben. Über die Radio-Buttons kann die Klassifizierungsmethode geändert werden (Für Details zu den Methodenunterschieden nutzen Sie bitte den Tooltip, der erscheint, wenn Sie mit dem Mauszeiger über eine der Optionen fahren)."
			  },
			  {
			    element: "#dateSliderWrapper",
			    title: "Zeitstrahl",
					placement: "top",
			    content: "Die Zeitleiste am unteren Bildschirmrand enthält die verfügbaren Zeitschnitte des selektierten Indikators. Standardmäßig ist der aktuellste Zeitschnitt voreingestellt. Ein Klicken auf einen beliebigen Punkt der Leiste oder durch Verschieben des runden Auswahlknopfs können Sie den Zeitschnitt ändern."
			  }
			]});

			// Initialize the tour
			kommonitorDataExchangeService.guidedTour.init();
			// Start the tour
			try{
				kommonitorDataExchangeService.guidedTour.restart();
			}
			catch(error){
					kommonitorDataExchangeService.guidedTour.start(true);
			}
		};

	}
]});
