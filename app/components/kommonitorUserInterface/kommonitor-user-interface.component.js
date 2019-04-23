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

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

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
			$rootScope.$broadcast("redrawGuidedTourElement");

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
			$rootScope.$broadcast("redrawGuidedTourElement");

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
			$rootScope.$broadcast("redrawGuidedTourElement");

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
				$rootScope.$broadcast("redrawGuidedTourElement");
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
			$rootScope.$broadcast("redrawGuidedTourElement");

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
			$rootScope.$broadcast("redrawGuidedTourElement");
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
			$rootScope.$broadcast("redrawGuidedTourElement");
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
			$rootScope.$broadcast("redrawGuidedTourElement");
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
			$rootScope.$broadcast("redrawGuidedTourElement");
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

		$scope.$on("startGuidedTour", function(event){
				$scope.startGuidedTour();
		});

		$scope.tourOptions = {
			container: "body",
			backdrop: true,
			backdropContainer: "body",
			smartPlacement: false,
			onEnd: function(tour){
				kommonitorDataExchangeService.guidedTour = undefined;
			},
			// template: "<div class='popover tour'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div><div class='popover-navigation'><div class='btn-group'>    <button class='btn btn-default' data-role='prev'>« Prev</button>    <span data-role='separator'>|</span>    <button class='btn btn-default' data-role='next'>Next »</button></div>	</div><button class='btn btn-default' data-role='end'>End tour</button></div>",
			steps: [
			{
				element: "#header",
				title: "Header",
				placement: "bottom",
				content: "In der Kopfzeile befinden sich neben dem Titel der Webanwendung ein <b>Info-Button</b>, der das beim Aufurf der Seite erschienene Informationsfenster &ouml;ffnet, sowie Button zum (erneuten) <b>Starten der gef&uuml;hrten Tour</b>. Ganz rechts sehen Sie dar&uuml;ber hinaus die Logos der Partner des Projekts KomMonitor, inklusive Links zu deren Webseiten."
			},
			{
				element: "#map",
				title: "Kartenfenster",
				placement: "top",
				content: "Beim Anwendungsstart sehen Sie zun&auml;chst die <b>kartographische Darstellung</b> eines ausgew&auml;hlten Indikators. In dieser Darstellung k&ouml;nnen Sie in der <b>Karte frei navigieren (zoomen, verschieben)</b> und beim <i>Her&uuml;berfahren mit dem Mauszeiger &uuml;ber eines der Indikator-Geometrien</i> erhalten sie ein <b>Popup mit dem Indikator-Wert</b>."
			},
			{
				element: "#infoControl",
				title: "Indikatoren-Informationsfenster",
				placement: "left",
				content: "Dieses Element enth&auml;lt relevante <b>Metadaten</b> &uuml;ber den dargestellten Indikator. Dar&uuml;ber hinaus kann die <b>Raumebene gewechselt</b> werden (in Abh&auml;ngigkeit der verf&uuml;gbaren Raumebenen des selektierten Indikators). <br/><br/>Die <b>Checkbox</b> unten steuert, ob der <b>Indikator-Layer semi-transparent</b> dargestellt werden soll."
			},
			{
				element: "#legendControl",
				title: "Indikatoren-Legende",
				placement: "left",
				content: "Dieses Element repr&auml;sentiert die <b>Legende</b>, sprich die Zuordnung von Indikatorenwertebereichen zu Darstellungsfarben. &Uuml;ber die <b>Radio-Buttons</b> kann die <b>Klassifizierungsmethode</b> ge&auml;ndert werden (F&uuml;r Details zu den Methodenunterschieden nutzen Sie bitte den <b>Tooltip</b>, der erscheint, wenn Sie mit dem <i>Mauszeiger &uuml;ber eine der Optionen fahren</i>)."
			},
			{
				element: "#dateSliderWrapper",
				title: "Zeitstrahl",
				placement: "top",
				content: "Die <b>Zeitleiste</b> am unteren Bildschirmrand enth&auml;lt die <b>verf&uuml;gbaren Zeitschnitte des selektierten Indikators</b>. Standardm&auml;ßig ist der aktuellste Zeitschnitt voreingestellt. Ein <i>Klicken auf einen beliebigen Punkt der Leiste oder durch Verschieben des runden Auswahlknopfs</i> k&ouml;nnen Sie den <b>Zeitschnitt &auml;ndern</b>."
			},
			{
				element: "#mapUtilButtons",
				title: "Hilfs-Buttons f&uuml;r die Kartendarstellung",
				placement: "bottom",
				content: "Diese Buttons bieten Hilfsfunktionen f&uuml;r die Kartendarstellung. &Uuml;ber <b>Plus</b> und <b>Minus</b> kann anstelle des Mausrads gezoomt werden. <br/><br/>Der <b>Weltkugel-Button</b> zentriert die Karte und zoomt auf die maximale Ausdehnung des Indikator-Layers. <br/><br/>Der nachfolgende Button <b>hebt die Selektion von kartographischen Features</b> auf. <br/><br/>Abschließend bietet der rechte <b>Layer-Button</b> die M&ouml;glichkeit, einzelne Layer <b>tempor&auml;r auszublenden oder die Hintergrundkarte zu wechseln</b>."
			},
			{
				element: "#sideBarButtons",
				title: "Men&uuml;-Buttons",
				placement: "right",
				content: "Diese Buttons &ouml;ffnen jeweils ein linkseitig angeordnetets <b>Men&uuml;</b>, um zus&auml;tzliche Funktionen auszuf&uuml;hren. Jedes Men&uuml; wird in einem weiteren Tour-Schritt kurz erl&auml;utert."
			},
			{
				element: "#sidebarIndicatorConfigCollapse",
				title: "Indikatorenkatalog und Verkn&uuml;pfungen zu anderen Indikatoren oder Geodaten",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet das Indikatoren-Auswahl-Fenster. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarIndicatorConfigClass === "hidden"){
							$("#sidebarIndicatorConfigCollapse").click();
					}
				},
			},
			{
				element: "#indicatorSetup",
				title: "Indikatorenkatalog und Verkn&uuml;pfungen zu anderen Indikatoren oder Geodaten",
				placement: "right",
				content: "Dieses Men&uuml; enth&auml;lt eine <b>&Uuml;bersicht verf&uuml;gbarer Indikatoren</b> sowie der Option, den derzeitig betrachteten <b>Indikator zu wechseln</b> oder den Indikator in der gew&auml;hlten Raumebene zu <b>exportieren</b> (derzeitg nur eingeschr&auml;nkte Download-Optionen). <br/><br/>Im obigen <b>Themenfilter</b> kann die &Uuml;bersicht der Indikatoren je nach Thema gefiltert werden. <br/><br/>Sollte ein Indikator etwaige <b>Verkn&uuml;pfungen</b> zu anderen Indikatoren oder sonstigen Geodaten beinhalten, so werden diese in tabellarischer Form kenntlich gemacht.",
				onNext: function(tour){
					if($scope.sidebarIndicatorConfigClass !== "hidden"){
							$("#sidebarIndicatorConfigCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarIndicatorConfigClass !== "hidden"){
							$("#sidebarIndicatorConfigCollapse").click();
					}
				}
			},
			{
				element: "#sidebarPoiCollapse",
				title: "Points of Interest",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet das Point of Interest Fenster. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarPoiClass === "hidden"){
							$("#sidebarPoiCollapse").click();
					}
				}
			},
			{
				element: "#poi",
				title: "Points of Interest",
				placement: "right",
				content: "Zur &Uuml;berlagerung von fl&auml;chenhaften Indikator-Geometrien mit weiteren relevanten Geodaten k&ouml;nnen hier sogenannte <b>Points of Interest (POI) Layer</b> zur Karte hinzugef&uuml;gt werden. Hinzuf&uuml;gen und Entfernen der POI-Layer geschieht dabei intuitiv durch <i>Checkboxes</i>. <br/><br/>In der Standardkonfiguration werden die einzelnen Punktgeometrien r&auml;umlich zu sogenannten <b>Cluster-Punkten</b> zusammengefasst, um die Darstellung je nach Zoom-Stufe zu optimieren. &Uuml;ber eine entsprechende <i>Auswahloption</i> k&ouml;nnen jedoch bei jeder Zoomstufe auch <b>alle Einzelpunkte dargestellt</b> werden.",
				onNext: function(tour){
					if($scope.sidebarPoiClass !== "hidden"){
							$("#sidebarPoiCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarPoiClass !== "hidden"){
							$("#sidebarPoiCollapse").click();
					}
				}
			},
			{
				element: "#sidebarFilterCollapse",
				title: "Darstellungsfilter",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur Definition von Darstellungsfiltern. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarFilterClass === "hidden"){
							$("#sidebarFilterCollapse").click();
					}
				}
			},
			{
				element: "#kommonitorFilter",
				title: "Darstellungsfilter",
				placement: "right",
				content: "Hier k&ouml;nnen verschiedene <b>Darstellungsfilter</b> angewendet werden, die sich auf die <i>kartographische Darstellung</i> auswirken. Dar&uuml;ber k&ouml;nnen je nach Fragestellung die Raumebenen-Geometrien (z.B. Stadtteile) auf diejenigen eingeschr&auml;nkt werden, die zur Beantwortung der Fragestellung beitragen. <br/><br/>Ein besonderer Filter ist die <b>dynamische Schwellwetklassifizierung</b>, bei der ein spezifischer <b>Trennwert</b> angegeben werden kann, der die Indikator-Features in zwei Gruppen einteilt, gr&ouml;ßer und kleiner dem Trennwert, die in der kartographischen Darstellung entsprechendend klassifiziert werden. Dieser Filtertyp eignet sich besonders bei Fragestellungen, bei denen Features identifiziert werden sollen, die einen bestimmten Zielgrad erreichen / nicht erreichen (z.B. Versorgungsquoten).",
				onNext: function(tour){
					if($scope.sidebarFilterClass !== "hidden"){
							$("#sidebarFilterCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarFilterClass !== "hidden"){
							$("#sidebarFilterCollapse").click();
					}
				}
			},
			{
				element: "#sidebarBalanceCollapse",
				title: "Zeitliche Bilanzierung",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur zeitlichen Bilanzierung des aktuell dargestellten Indikators. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarBalanceClass === "hidden"){
							$("#sidebarBalanceCollapse").click();
					}
				}
			},
			{
				element: "#kommonitorBalance",
				title: "Zeitliche Bilanzierung",
				placement: "right",
				content: "Bei der zeitlichen Bilanzierung steht die <b>Wertentwicklung eines Indikators</b> &uuml;ber die Zeit im Fokus (Wachstum / Schrumpfung). Wird die Bilanzierung mittels der entsprehenden <b>Checkbox</b> aktiviert, so kann &uuml;ber die Zeitleiste ein <b>Zeitraum</b> spezifiziert werden, f&uuml;r den die Wertentwicklung berechnet und dargestellt werden soll. <br/><br/>Die Indikatoren-Legende am unteren rechten Rand der Anwendung zeigt &uuml;ber dies textuell an, ob die Bilanz des Indikators dargestellt wird.<br/><br/>Bitte bachten Sie, dass bei Indikatoren mit nur einem Zeitschnitt eine Bilanzierung zwar technisch m&ouml;glich ist, aber f&uuml;r alle Geometrien der Raumebene den Wert '0' resultiert.",
				onNext: function(tour){
					if($scope.sidebarBalanceClass !== "hidden"){
							$("#sidebarBalanceCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarBalanceClass !== "hidden"){
							$("#sidebarBalanceCollapse").click();
					}
				}
			},
			{
				element: "#sidebarDiagramsCollapse",
				title: "Klassische statistische Diagramme",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster mit klassischen statistischen Diagrammen. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarDiagramsClass === "hidden"){
							$("#sidebarDiagramsCollapse").click();
					}
				}
			},
			{
				element: "#indicatorDiagrams",
				title: "Klassische statistische Diagramme",
				placement: "right",
				content: "Zus&auml;tzlich zur kartographischen Darstellung bieten grundlegende <b>statistische Diagramme</b> hilfreiche Zusatzinformationen zum gew&auml;hlten Indikator. <br/><br/> Das obige <b>Histogramm</b> fokussiert die <b>Wertverteilung</b> und zeigt an, wie viele Element der Raumebene in welchem Klassenintervall liegen. <br/>Ein <b>Ranking</b> der Raumebenen-Geometrien wird &uuml;ber das mittlere <b>S&auml;ulendiagramm</b> erm&ouml;glicht, welches nur f&uuml;r Raumebenen mit einer maximalen Anzahl von 75 Element generiert werden kann. <br/>Das untere <b>Liniendiagramm</b> zeigt schließlich die <b>zeitliche Entwicklung</b> des aktuellen Indikators, in der bereits der Durchschnitt aller Geometrien der Raumebene vorberechnet ist.<br/><br/>Um einzelne Geometrien der gew&auml;hlten Raumebene im S&auml;ulen- und Liniendiagramm zu betrachten und <i>hervorzuheben</i>, kann mit dem <i>Mauszeiger</i> entweder &uuml;ber die <i>S&auml;ule innerhalb des S&auml;ulendiagramms</i> oder &uuml;ber die jeweilige <i>Geometrie in der Karte</i> gefahren werden. Eine dauerhafte Selektion durch Klicken auf die Geometrie erm&ouml;glicht das simultane Betrachten mehrerer Geometrien.<br/><br/>Jedes Diagramm enth&auml;lt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
				onNext: function(tour){
					if($scope.sidebarDiagramsClass !== "hidden"){
							$("#sidebarDiagramsCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarDiagramsClass !== "hidden"){
							$("#sidebarDiagramsCollapse").click();
					}
				}
			},
			{
				element: "#sidebarRadarDiagramCollapse",
				title: "Indikatorenradar",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet das Indiktorenradar f&uuml;r die Querschnittsbetrachtung mehrerer Indikatoren. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarRadarDiagramClass === "hidden"){
							$("#sidebarRadarDiagramCollapse").click();
					}
				}
			},
			{
				element: "#indicatorRadar",
				title: "Indikatorenradar",
				placement: "right",
				content: "Das <b>Indikatorenradar</b> eignet sich insbesondere f&uuml;r die <b>querschnittsorientierte Betrachtung mehrerer Indikatoren</b>. <br/>Um eine Darstellung zu erzeugen, <i>selektieren Sie bitte mindestens einen Indikator</i> aus der unten stehenden Liste (empfohlen sind mindestens drei, damit ein Raum mit drei Achsen aufgespannt werden kann). <br/>F&uuml;r jeden gew&auml;hlten Indikator wird im Diagramm eine Achse genutzt, auf der einzelne Raumebenen-Geometrien anhand ihrer Wertauspr&auml;gung abgetragen werden. Jede Achse wird dabei durch <b>Minimum und Maximum</b> der Geometrien der betrachteten Raumebene gebildet (daher ist die <b><i>Radarmitte ausdr&uuml;cklich nicht zwingend mit dem Wert '0' gleichzusetzen, sondern mit dem Minimalwert des Indikators</i></b>). <br/><br/>Auch hier ist der Durchschnitt aller Geometrien bereits vorberechnet und einzelne Geometrien k&ouml;nnen mittels Selektion in der Karte hinzugef&uuml;gt werden. <br/><br/>Die Indikatorenauswahl umfasst dabei nur solche Indikatoren, die die gew&auml;hlte Raumebene und den aktuell gew&auml;hlten Zeitschnitt unterst&uuml;tzen.<br/><br/> Auch das Radardiagramm besitzt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann",
				onNext: function(tour){
					if($scope.sidebarRadarDiagramClass !== "hidden"){
							$("#sidebarRadarDiagramCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarRadarDiagramClass !== "hidden"){
							$("#sidebarRadarDiagramCollapse").click();
					}
				}
			},
			{
				element: "#sidebarRegressionDiagramCollapse",
				title: "Regressionsdiagramm",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet Fenster zur Definition von Regressionsdiagrammen. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarRegressionDiagramClass === "hidden"){
							$("#sidebarRegressionDiagramCollapse").click();
					}
				}
			},
			{
				element: "#indicatorRegression",
				title: "Regressionsdiagramm",
				placement: "right",
				content: "Als exemplarischer weiterer Diagrammtyp unterst&uuml;tzt KomMonitor die Berechnung einer <b>linearen Regression</b> zwischen zwei zu w&auml;hlenden Indikatoren, um insbesondere die <b>Korrelation</b> zwischen diesen zu bestimmen. Nach Auswahl der Indikatoren werden die Regressionsgerade und alle Elemente der gew&auml;hlten Raumebene gem&auml;ß ihrer Wertauspr&auml;gungen entlang der Indikatorenachsen im Diagramm abgetragen. <br/><br/>Beim &Uuml;berfahren eines Datenpunkts mit der Maus im Diagramm oder einer in der Karte dargestellten Geometrie, wird das jeweilige Pendant visuell hervorgehoben.<br/><br/>Die Indikatorenauswahl umfasst dabei nur solche Indikatoren, die die gew&auml;hlte Raumebene und den aktuell gew&auml;hlten Zeitschnitt unterst&uuml;tzen.<br/><br/> Auch das Regressionsdiagramm besitzt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
				onNext: function(tour){
					if($scope.sidebarRegressionDiagramClass !== "hidden"){
							$("#sidebarRegressionDiagramCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarRegressionDiagramClass !== "hidden"){
							$("#sidebarRegressionDiagramCollapse").click();
					}
				}
			},
			{
				element: "#sidebarReachabilityCollapse",
				title: "Erreichbarkeitsanalysen",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster f&uuml;r Erreichbarkeitsanalysen. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarReachabilityClass === "hidden"){
							$("#sidebarReachabilityCollapse").click();
					}
				}
			},
			{
				element: "#kommonitorReachability",
				title: "Erreichbarkeitsanalysen",
				placement: "right",
				content: "Als GIS-basiertes Werkzeug soll KomMonitor ausgew&auml;hlte <b>r&auml;umliche Analysen</b> unterst&uuml;tzen. Insbesondere stehen <b>Erreichbarkeitsanalysen</b> im Fokus, bei denen, neben reinen <i>Puffer-basierten Ans&auml;tzen</i>, <b>Erreichbarkeiten anhand tats&auml;chlicher Wegenetze</b> f&uuml;r verschiedenen <b>Transportmittel (z.B. Fußg&auml;nger, Fahrrad, Auto)</b> zu berechnen sind. Konkret soll hierbei sowohl ein <b>Routing</b> zwischen einzelnen Punkten sowie die Berechnung von <b>Isochronen (&Auml;quidistanzen und zeitliches Abbruchkriterium)</b> angeboten werden.<br/><br/>Derzeit sind lediglich ausgew&auml;hlte, vordefinierte Berechnungen durchf&uuml;hrbar. Frei definierbare Erreichbarkeitsanalysen folgen demn&auml;chst.",
				onNext: function(tour){
					if($scope.sidebarReachabilityClass !== "hidden"){
							$("#sidebarReachabilityCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarReachabilityClass !== "hidden"){
							$("#sidebarReachabilityCollapse").click();
					}
				}
			},
			{
				element: "#sidebarProcessingCollapse",
				title: "Individuelle Indikatoren-Neuberechnung",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur individuellen Neuberechnung einzelner Indikatoren. <br/><br/>Beim Wechsel auf das n&auml;chste Tour-Element wird das Men&uuml; automatisch ge&ouml;ffnet.",
				onNext: function(tour){
					if($scope.sidebarProcessingClass === "hidden"){
							$("#sidebarProcessingCollapse").click();
					}
				}
			},
			{
				element: "#indicatorProcessing",
				title: "Individuelle Indikatoren-Neuberechnung",
				placement: "right",
				content: "KomMonitor ist mehr als nur ein Darstellungswerkzeug. Es erm&ouml;glicht insbesondere auch die <b>automatisierte Berechnung von Indikatoren</b>. Je nach Berechnungsvorschrift kann es dabei <b>konfigurierbare Parameter</b> geben, die die <i>resultierenden Indikatorenwerte beeinflussen</i> (bspw. eine maximle Distanz bei Erreichbarkeiten oder Gewichtungen grundlegender Eingangsdaten). <br/><br/>Dieses Men&uuml; bietet die M&ouml;glichkeit einer <b>Nutzer-individualisierten Neu-Berechnung von Indikatoren</b> mit mindestens einem solchen konfigurierbaren Indikator. Experten k&ouml;nnen hiermit verschiedene <i>Szenarien</i> testen, indem die Berechnung mit verschiedenen <i>Parameter-Einstellungen</i> f&uuml;r einen <i>Zielzeitschnitt</i> und eine <i>Zielraumebene</i> wiederholt wird. <br/><br/>Das jeweilige Ergebnis steht tempor&auml;r zur Verf&uuml;gung und kann bei Bedarf exportiert werden. <br/>K&uuml;nftig sollen dar&uuml;ber hinaus unmittelbare Vergleiche mit der 'Standard'-Variante des Indikators angeboten werden. Diese sind jedoch zum gegenw&auml;rtigen Zeitpunkt noch nicht in der Anwendung umgesetzt.",
				onNext: function(tour){
					if($scope.sidebarProcessingClass !== "hidden"){
							$("#sidebarProcessingCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarProcessingClass !== "hidden"){
							$("#sidebarProcessingCollapse").click();
					}
				}
			}
		]};

		$scope.startGuidedTour = function(){
			// GUIDED TOUR
			// Instance the tour
			kommonitorDataExchangeService.guidedTour = new Tour($scope.tourOptions);

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

		$scope.$on("redrawGuidedTourElement", async function(event){

			await sleep(100);

			if(kommonitorDataExchangeService.guidedTour){
				kommonitorDataExchangeService.guidedTour.redraw();
			}
		});

	}
]});
