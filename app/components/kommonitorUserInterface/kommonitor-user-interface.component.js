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
				content: "In der Kopfzeile befinden sich neben dem Titel der Webanwendung ein <b>Info-Button</b>, der das beim Aufurf der Seite erschienene Informationsfenster öffnet, sowie Button zum (erneuten) <b>Starten der geführten Tour</b>. Ganz rechts sehen Sie darüber hinaus die Logos der Partner des Projekts KomMonitor, inklusive Links zu deren Webseiten."
			},
			{
				element: "#map",
				title: "Kartenfenster",
				placement: "top",
				content: "Beim Anwendungsstart sehen Sie zunächst die <b>kartographische Darstellung</b> eines zufällig ausgewählten Indikators. In dieser Darstellung können Sie in der <b>Karte frei navigieren (zoomen, verschieben)</b> und beim <i>Herüberfahren mit dem Mauszeiger über eines der Indikator-Geometrien</i> erhalten sie ein <b>Popup mit dem Indikator-Wert</b>."
			},
			{
				element: "#infoControl",
				title: "Indikatoren-Informationsfenster",
				placement: "left",
				content: "Dieses Element enthält relevante <b>Metadaten</b> über den dargestellten Indikator. Darüber hinaus kann die <b>Raumebene gewechselt</b> werden (in Abhängigkeit der verfügbaren Raumebenen des selektierten Indikators). <br/><br/>Die <b>Checkbox</b> unten steuert, ob der <b>Indikator-Layer semi-transparent</b> dargestellt werden soll."
			},
			{
				element: "#legendControl",
				title: "Indikatoren-Legende",
				placement: "left",
				content: "Dieses Element repräsentiert die <b>Legende</b>, sprich die Zuordnung von Indikatorenwertebereichen zu Darstellungsfarben. Über die <b>Radio-Buttons</b> kann die <b>Klassifizierungsmethode</b> geändert werden (Für Details zu den Methodenunterschieden nutzen Sie bitte den <b>Tooltip</b>, der erscheint, wenn Sie mit dem <i>Mauszeiger über eine der Optionen fahren</i>)."
			},
			{
				element: "#dateSliderWrapper",
				title: "Zeitstrahl",
				placement: "top",
				content: "Die <b>Zeitleiste</b> am unteren Bildschirmrand enthält die <b>verfügbaren Zeitschnitte des selektierten Indikators</b>. Standardmäßig ist der aktuellste Zeitschnitt voreingestellt. Ein <i>Klicken auf einen beliebigen Punkt der Leiste oder durch Verschieben des runden Auswahlknopfs</i> können Sie den <b>Zeitschnitt ändern</b>."
			},
			{
				element: "#mapUtilButtons",
				title: "Hilfs-Buttons für die Kartendarstellung",
				placement: "bottom",
				content: "Diese Buttons bieten Hilfsfunktionen für die Kartendarstellung. Über <b>Plus</b> und <b>Minus</b> kann anstelle des Mausrads gezoomt werden. <br/><br/>Der <b>Weltkugel-Button</b> zentriert die Karte und zoomt auf die maximale Ausdehnung des Indikator-Layers. <br/><br/>Der nachfolgende Button <b>hebt die Selektion von kartographischen Features</b> auf. <br/><br/>Abschließend bietet der rechte <b>Layer-Button</b> die Möglichkeit, einzelne Layer <b>temporär auszublenden oder die Hintergrundkarte zu wechseln</b>."
			},
			{
				element: "#sideBarButtons",
				title: "Menü-Buttons",
				placement: "right",
				content: "Diese Buttons öffnen jeweils ein linkseitig angeordnetets <b>Menü</b>, um zusätzliche Funktionen auszuführen. Jedes Menü wird in einem weiteren Tour-Schritt kurz erläutert."
			},
			{
				element: "#sidebarIndicatorConfigCollapse",
				title: "Indikatorenkatalog und Verknüpfungen zu anderen Indikatoren oder Geodaten",
				placement: "right",
				content: "Ein Klick auf diesen Button öffnet das Indikatoren-Auswahl-Fenster. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
				onNext: function(tour){
					if($scope.sidebarIndicatorConfigClass === "hidden"){
							$("#sidebarIndicatorConfigCollapse").click();
					}
				},
			},
			{
				element: "#indicatorSetup",
				title: "Indikatorenkatalog und Verknüpfungen zu anderen Indikatoren oder Geodaten",
				placement: "right",
				content: "Dieses Menü enthält eine <b>Übersicht verfügbarer Indikatoren</b> sowie der Option, den derzeitig betrachteten <b>Indikator zu wechseln</b> oder den Indikator in der gewählten Raumebene zu <b>exportieren</b> (derzeitg nur eingeschränkte Download-Optionen). <br/><br/>Im obigen <b>Themenfilter</b> kann die Übersicht der Indikatoren je nach Thema gefiltert werden. <br/><br/>Sollte ein Indikator etwaige <b>Verknüpfungen</b> zu anderen Indikatoren oder sonstigen Geodaten beinhalten, so werden diese in tabellarischer Form kenntlich gemacht.",
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
				content: "Ein Klick auf diesen Button öffnet das Point of Interest Fenster. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "Zur Überlagerung von flächenhaften Indikator-Geometrien mit weiteren relevanten Geodaten können hier sogenannte <b>Points of Interest (POI) Layer</b> zur Karte hinzugefügt werden. Hinzufügen und Entfernen der POI-Layer geschieht dabei intuitiv durch <i>Checkboxes</i>. <br/><br/>In der Standardkonfiguration werden die einzelnen Punktgeometrien räumlich zu sogenannten <b>Cluster-Punkten</b> zusammengefasst, um die Darstellung je nach Zoom-Stufe zu optimieren. Über eine entsprechende <i>Auswahloption</i> können jedoch bei jeder Zoomstufe auch <b>alle Einzelpunkte dargestellt</b> werden.",
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
				content: "Ein Klick auf diesen Button öffnet ein Fenster zur Definition von Darstellungsfiltern. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "Hier können verschiedene <b>Darstellungsfilter</b> angewendet werden, die sich auf die <i>kartographische Darstellung</i> auswirken. Darüber können je nach Fragestellung die Raumebenen-Geometrien (z.B. Stadtteile) auf diejenigen eingeschränkt werden, die zur Beantwortung der Fragestellung beitragen. <br/><br/>Ein besonderer Filter ist die <b>dynamische Schwellwetklassifizierung</b>, bei der ein spezifischer <b>Trennwert</b> angegeben werden kann, der die Indikator-Features in zwei Gruppen einteilt, größer und kleiner dem Trennwert, die in der kartographischen Darstellung entsprechendend klassifiziert werden. Dieser Filtertyp eignet sich besonders bei Fragestellungen, bei denen Features identifiziert werden sollen, die einen bestimmten Zielgrad erreichen / nicht erreichen (z.B. Versorgungsquoten).",
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
				content: "Ein Klick auf diesen Button öffnet ein Fenster zur zeitlichen Bilanzierung des aktuell dargestellten Indikators. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "Bei der zeitlichen Bilanzierung steht die <b>Wertentwicklung eines Indikators</b> über die Zeit im Fokus (Wachstum / Schrumpfung). Wird die Bilanzierung mittels der entsprehenden <b>Checkbox</b> aktiviert, so kann über die Zeitleiste ein <b>Zeitraum</b> spezifiziert werden, für den die Wertentwicklung berechnet und dargestellt werden soll. <br/><br/>Die Indikatoren-Legende am unteren rechten Rand der Anwendung zeigt über dies textuell an, ob die Bilanz des Indikators dargestellt wird.<br/><br/>Bitte bachten Sie, dass bei Indikatoren mit nur einem Zeitschnitt eine Bilanzierung zwar technisch möglich ist, aber für alle Geometrien der Raumebene den Wert '0' resultiert.",
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
				content: "Ein Klick auf diesen Button öffnet ein Fenster mit klassischen statistischen Diagrammen. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "Zusätzlich zur kartographischen Darstellung bieten grundlegende <b>statistische Diagramme</b> hilfreiche Zusatzinformationen zum gewählten Indikator. <br/><br/> Das obige <b>Histogramm</b> fokussiert die <b>Wertverteilung</b> und zeigt an, wie viele Element der Raumebene in welchem Klassenintervall liegen. <br/>Ein <b>Ranking</b> der Raumebenen-Geometrien wird über das mittlere <b>Säulendiagramm</b> ermöglicht, welches nur für Raumebenen mit einer maximalen Anzahl von 75 Element generiert werden kann. <br/>Das untere <b>Liniendiagramm</b> zeigt schließlich die <b>zeitliche Entwicklung</b> des aktuellen Indikators, in der bereits der Durchschnitt aller Geometrien der Raumebene vorberechnet ist.<br/><br/>Um einzelne Geometrien der gewählten Raumebene im Säulen- und Liniendiagramm zu betrachten und <i>hervorzuheben</i>, kann mit dem <i>Mauszeiger</i> entweder über die <i>Säule innerhalb des Säulendiagramms</i> oder über die jeweilige <i>Geometrie in der Karte</i> gefahren werden. Eine dauerhafte Selektion durch Klicken auf die Geometrie ermöglicht das simultane Betrachten mehrerer Geometrien.<br/><br/>Jedes Diagramm enthält in der oberen rechte Ecke eine <b>Toolbox</b>, über die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
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
				content: "Ein Klick auf diesen Button öffnet das Indiktorenradar für die Querschnittsbetrachtung mehrerer Indikatoren. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "Das <b>Indikatorenradar</b> eignet sich insbesondere für die <b>querschnittsorientierte Betrachtung mehrerer Indikatoren<b/>. <br/>Um eine Darstellung zu erzeugen, <i>selektieren Sie bitte mindestens einen Indikator</i> aus der unten stehenden Liste (empfohlen sind mindestens drei, damit ein Raum mit drei Achsen aufgespannt werden kann). <br/>Für jeden gewählten Indikator wird im Diagramm eine Achse genutzt, auf der einzelne Raumebenen-Geometrien anhand ihrer Wertausprägung abgetragen werden. Jede Achse wird dabei durch <b>Minimum und Maximum</b> der Geometrien der betrachteten Raumebene gebildet (daher ist die <b><i>Radarmitte ausdrücklich nicht zwingend mit dem Wert '0' gleichzusetzen, sondern mit dem Minimalwert des Indikators</i></b>). <br/><br/>Auch hier ist der Durchschnitt aller Geometrien bereits vorberechnet und einzelne Geometrien können mittels Selektion in der Karte hinzugefügt werden. <br/><br/> Auch das Radardiagramm besitzt in der oberen rechte Ecke eine <b>Toolbox</b>, über die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann",
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
				content: "Ein Klick auf diesen Button öffnet Fenster zur Definition von Regressionsdiagrammen. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "Als exemplarischer weiterer Diagrammtyp unterstützt KomMonitor die Berechnung einer <b>linearen Regression</b> zwischen zwei zu wählenden Indikatoren, um insbesondere die <b>Korrelation</b> zwischen diesen zu bestimmen. Nach Auswahl der Indikatoren werden die Regressionsgerade und alle Elemente der gewählten Raumebene gemäß ihrer Wertausprägungen entlang der Indikatorenachsen im Diagramm abgetragen. <br/><br/>Beim Überfahren eines Datenpunkts mit der Maus im Diagramm oder einer in der Karte dargestellten Geometrie, wird das jeweilige Pendant visuell hervorgehoben.<br/><br/> Auch das Regressionsdiagramm besitzt in der oberen rechte Ecke eine <b>Toolbox</b>, über die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
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
				content: "Ein Klick auf diesen Button öffnet ein Fenster für Erreichbarkeitsanalysen. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "Als GIS-basiertes Werkzeug soll KomMonitor ausgewählte <b>räumliche Analysen</b> unterstützen. Insbesondere stehen <b>Erreichbarkeitsanalysen</b> im Fokus, bei denen, neben reinen <i>Puffer-basierten Ansätzen</i>, <b>Erreichbarkeiten anhand tatsächlicher Wegenetze</b> für verschiedenen <b>Transportmittel (z.B. Fußgänger, Fahrrad, Auto)</b> zu berechnen sind. Konkret soll hierbei sowohl ein <b>Routing</b> zwischen einzelnen Punkten sowie die Berechnung von <b>Isochronen (Äquidistanzen und zeitliches Abbruchkriterium)</b> angeboten werden.<br/><br/>Derzeit sind lediglich ausgewählte, vordefinierte Berechnungen durchführbar. Frei definierbare Erreichbarkeitsanalysen folgen demnächst.",
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
				content: "Ein Klick auf diesen Button öffnet ein Fenster zur individuellen Neuberechnung einzelner Indikatoren. <br/><br/>Beim Wechsel auf das nächste Tour-Element wird das Menü automatisch geöffnet.",
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
				content: "KomMonitor ist mehr als nur ein Darstellungswerkzeug. Es ermöglicht insbesondere auch die <b>automatisierte Berechnung von Indikatoren</b>. Je nach Berechnungsvorschrift kann es dabei <b>konfigurierbare Parameter</b> geben, die die <i>resultierenden Indikatorenwerte beeinflussen</i> (bspw. eine maximle Distanz bei Erreichbarkeiten oder Gewichtungen grundlegender Eingangsdaten). <br/><br/>Dieses Menü bietet die Möglichkeit einer <b>Nutzer-individualisierten Neu-Berechnung von Indikatoren</b> mit mindestens einem solchen konfigurierbaren Indikator. Experten können hiermit verschiedene <i>Szenarien</i> testen, indem die Berechnung mit verschiedenen Parameter-Einstellungen wiederholt wird. <br/>Das jeweilige Ergebnis steht temporär zur Verfügung und kann bei Bedarf exportiert werden.",
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
